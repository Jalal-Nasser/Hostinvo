<?php

namespace App\Services\Auth;

use App\Contracts\Repositories\Auth\UserRepositoryInterface;
use App\Models\Role;
use App\Models\User;
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
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly PasswordResetTenantContext $passwordResetTenantContext,
    ) {}

    public function login(array $payload, Request $request): User
    {
        $user = $this->users->findByEmail($payload['email']);

        $this->ensureLoginAllowed($user);

        if (! Auth::attempt([
            'email' => $payload['email'],
            'password' => $payload['password'],
            'is_active' => true,
        ], (bool) ($payload['remember'] ?? false))) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        $request->session()->regenerate();

        $user = $request->user() instanceof User
            ? $request->user()
            : $this->users->findByEmail($payload['email']);

        $request->session()->put('tenant_id', $user?->tenant_id);
        $user->forceFill([
            'last_login_at' => now(),
        ]);

        $this->users->save($user);

        return $this->currentUser($user);
    }

    public function logout(Request $request): void
    {
        $request->user()?->currentAccessToken()?->delete();

        Auth::guard('web')->logout();

        $request->session()->forget('tenant_id');
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }

    public function currentUser(User $user): User
    {
        return $user->loadMissing(['tenant', 'roles.permissions']);
    }

    public function sendPasswordResetLink(string $email, Request $request): string
    {
        $tenantId = $this->passwordResetTenantContext->resolveTenantIdFromRequest($request);

        if (! $tenantId) {
            throw ValidationException::withMessages([
                'email' => [__('auth.password_reset_tenant_required')],
            ]);
        }

        $user = $this->users->findByEmailForTenant($email, $tenantId);

        if (! $user || ! $user->is_active) {
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

        if (! $record
            || blank($record->token)
            || ! Hash::check($payload['token'], $record->token)
            || blank($record->created_at)
            || Carbon::parse($record->created_at)->lt($expiresAt)) {
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

        if ($user->tenant_id && optional($user->tenant)->status !== 'active' && ! $user->hasRole(Role::SUPER_ADMIN)) {
            throw ValidationException::withMessages([
                'email' => [__('auth.tenant_inactive')],
            ]);
        }
    }
}
