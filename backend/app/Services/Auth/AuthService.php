<?php

namespace App\Services\Auth;

use App\Contracts\Repositories\Auth\UserRepositoryInterface;
use App\Models\Role;
use App\Models\User;
use App\Services\Auth\Data\LoginResult;
use App\Services\Tenancy\TenantContextService;
use App\Support\Auth\PasswordResetTenantContext;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    private const FALLBACK_PASSWORD_HASH = '$2y$12$lEBCPmlo6p5znFWRF.DExeU3Ucag47VDbZsyNMysMKSPp/XQdDXwy';
    private const FALLBACK_RESET_TOKEN_HASH = '$2y$12$/px4jSB6T67lc9JasXYKp.ahKn5px5rMHuOPcqyt5zrK06qcO5YF.';

    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly PasswordResetTenantContext $passwordResetTenantContext,
        private readonly MfaService $mfa,
    ) {}

    public function login(array $payload, Request $request): LoginResult
    {
        $user = $this->users->findByEmail($payload['email']);
        $passwordValid = $this->verifyPasswordInConstantTime($user, (string) $payload['password']);

        if (! $user || ! $passwordValid) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        $this->ensureLoginAllowed($user);

        if ($this->mfa->shouldChallenge($user)) {
            // Evict any existing fully-authenticated session before entering the
            // MFA pending flow. Without this, the GET /auth/mfa/status endpoint
            // would see the old session as fully authenticated and return
            // state="authenticated", which causes the MFA challenge page to
            // immediately redirect to the dashboard — bypassing MFA entirely.
            if (Auth::guard('web')->check()) {
                Auth::guard('web')->logout();
            }

            $this->mfa->clearPendingState($request);

            return LoginResult::mfaRequired(
                $this->mfa->begin($user, (bool) ($payload['remember'] ?? false), $request)
            );
        }

        Auth::guard('web')->login($user, (bool) ($payload['remember'] ?? false));
        $request->session()->regenerate();
        $request->session()->forget(TenantContextService::ACTIVE_TENANT_SESSION_KEY);
        $user->forceFill([
            'last_login_at' => now(),
        ]);
        $request->session()->put('tenant_id', $user->tenant_id);

        $this->users->save($user);

        return LoginResult::authenticated(
            $this->currentUser($user)
        );
    }

    public function logout(Request $request): void
    {
        // Sanctum SPA (cookie/session) authentication uses a TransientToken,
        // which is not stored in the database and has no delete() method.
        // Only call delete() for real persisted PersonalAccessToken instances.
        $token = $request->user()?->currentAccessToken();

        if ($token instanceof \Laravel\Sanctum\PersonalAccessToken) {
            $token->delete();
        }

        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->forget(TenantContextService::ACTIVE_TENANT_SESSION_KEY);
            $request->session()->forget('tenant_id');
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }
    }

    public function currentUser(User $user): User
    {
        return $user->loadMissing(['tenant', 'roles.permissions']);
    }

    public function sendPasswordResetLink(string $email, Request $request): string
    {
        $tenantId = $this->passwordResetTenantContext->resolveTenantIdFromRequest($request);
        $user = $tenantId ? $this->users->findByEmailForTenant($email, $tenantId) : null;

        if (! $tenantId || ! $user || ! $user->is_active) {
            $this->equalizeForgotPasswordTiming();

            return trans('passwords.sent');
        }

        $token = Str::random(64);

        DB::table(config('auth.passwords.users.table', 'password_reset_tokens'))
            ->updateOrInsert(
                [
                    'tenant_id' => $tenantId,
                    'email' => $user->email,
                ],
                [
                    'token' => Hash::make($token),
                    'created_at' => now(),
                ],
            );

        $user->notify(new ResetPassword($token));

        return trans('passwords.sent');
    }

    public function resetPassword(array $payload, Request $request): string
    {
        $tenantId = $this->passwordResetTenantContext->resolveTenantIdFromRequest($request, $payload);

        if (! $tenantId) {
            throw ValidationException::withMessages([
                'email' => [__('auth.password_reset_tenant_required')],
            ]);
        }

        $user = $this->users->findByEmailForTenant($payload['email'], $tenantId);

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => [trans('passwords.user')],
            ]);
        }

        $record = DB::table(config('auth.passwords.users.table', 'password_reset_tokens'))
            ->where('tenant_id', $tenantId)
            ->where('email', $payload['email'])
            ->first();

        $expiresAt = now()->subMinutes((int) config('auth.passwords.users.expire', 60));
        $tokenValid = $this->verifyResetTokenInConstantTime(
            recordHash: is_string($record?->token ?? null) ? $record->token : null,
            incomingToken: (string) $payload['token'],
            createdAt: $record?->created_at,
            expiresAt: $expiresAt,
        );

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => [trans('passwords.user')],
            ]);
        }

        if (! $record || ! $tokenValid) {
            throw ValidationException::withMessages([
                'email' => [trans('passwords.token')],
            ]);
        }

        $user->forceFill([
            'password' => Hash::make($payload['password']),
            'remember_token' => Str::random(60),
        ])->save();

        DB::table(config('auth.passwords.users.table', 'password_reset_tokens'))
            ->where('tenant_id', $tenantId)
            ->where('email', $payload['email'])
            ->delete();

        event(new PasswordReset($user));

        return trans('passwords.reset');
    }

    private function ensureLoginAllowed(?User $user): void
    {
        if (! $user) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => [__('auth.inactive')],
            ]);
        }

        if ($user->email_verification_required && ! $user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'email' => [__('auth.email_verification_required')],
            ]);
        }

        if ($user->tenant_id && optional($user->tenant)->status !== 'active' && ! $user->hasRole(Role::SUPER_ADMIN)) {
            throw ValidationException::withMessages([
                'email' => [__('auth.tenant_inactive')],
            ]);
        }
    }

    private function verifyPasswordInConstantTime(?User $user, string $plainPassword): bool
    {
        $hash = is_string($user?->password ?? null) && $user->password !== ''
            ? $user->password
            : self::FALLBACK_PASSWORD_HASH;

        return Hash::check($plainPassword, $hash);
    }

    private function verifyResetTokenInConstantTime(
        ?string $recordHash,
        string $incomingToken,
        mixed $createdAt,
        Carbon $expiresAt
    ): bool {
        $hash = filled($recordHash) ? $recordHash : self::FALLBACK_RESET_TOKEN_HASH;
        $createdAtValue = Carbon::parse($createdAt ?: '1970-01-01T00:00:00+00:00');

        return Hash::check($incomingToken, $hash)
            && $createdAtValue->gte($expiresAt)
            && filled($recordHash);
    }

    private function equalizeForgotPasswordTiming(): void
    {
        usleep(random_int(100_000, 200_000));
    }
}
