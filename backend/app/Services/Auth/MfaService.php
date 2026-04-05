<?php

namespace App\Services\Auth;

use App\Contracts\Repositories\Auth\UserRepositoryInterface;
use App\Models\Role;
use App\Models\User;
use App\Models\UserMfaMethod;
use App\Models\UserRecoveryCode;
use App\Services\Security\TotpService;
use App\Services\Tenancy\TenantContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MfaService
{
    public function __construct(
        private readonly TotpService $totp,
        private readonly UserRepositoryInterface $users,
    ) {
    }

    public function shouldChallenge(User $user): bool
    {
        return $user->hasRole(Role::SUPER_ADMIN);
    }

    public function hasConfirmedTotp(User $user): bool
    {
        return $this->confirmedTotpMethod($user) !== null;
    }

    public function begin(User $user, bool $remember, Request $request): string
    {
        $request->session()->put($this->pendingSessionKey(), [
            'user_id' => $user->getKey(),
            'remember' => $remember,
            'started_at' => now()->toIso8601String(),
        ]);

        return $this->hasConfirmedTotp($user) ? 'mfa_required' : 'mfa_setup_required';
    }

    public function pendingStatus(Request $request): array
    {
        $user = $this->pendingUser($request);
        $mode = $this->hasConfirmedTotp($user) ? 'challenge' : 'setup';
        $secret = null;
        $otpAuthUrl = null;

        if ($mode === 'setup') {
            $secret = $this->setupSecret($request);
            $otpAuthUrl = $this->totp->buildOtpAuthUrl($user, $secret);
        }

        return [
            'mode' => $mode,
            'email' => $user->email,
            'secret' => $secret,
            'otp_auth_url' => $otpAuthUrl,
            'recovery_codes_remaining' => $user->recoveryCodes()->whereNull('used_at')->count(),
        ];
    }

    public function authenticatedStatus(User $user): array
    {
        return [
            'enrolled' => $this->hasConfirmedTotp($user),
            'recovery_codes_remaining' => $user->recoveryCodes()->whereNull('used_at')->count(),
        ];
    }

    public function confirmSetup(Request $request, string $code, ?string $currentPassword = null): array
    {
        $user = $request->user() instanceof User ? $request->user() : $this->pendingUser($request);

        if ($request->user() instanceof User) {
            $this->assertPassword($user, (string) $currentPassword);
        }

        $secret = $this->setupSecret($request);

        if (! $this->totp->verifyCode($secret, $code)) {
            throw ValidationException::withMessages([
                'code' => [__('auth.invalid_mfa_code')],
            ]);
        }

        UserMfaMethod::query()
            ->where('user_id', $user->getKey())
            ->where('type', UserMfaMethod::TYPE_TOTP)
            ->delete();

        UserMfaMethod::query()->create([
            'user_id' => $user->getKey(),
            'type' => UserMfaMethod::TYPE_TOTP,
            'label' => 'Authenticator',
            'secret' => encrypt($secret),
            'metadata' => [
                'issuer' => config('security.mfa.issuer', config('app.name', 'Hostinvo')),
            ],
            'confirmed_at' => now(),
            'last_used_at' => now(),
        ]);

        $codes = $this->replaceRecoveryCodes($user);

        $request->session()->forget($this->setupSecretSessionKey());

        if ($this->hasPendingChallenge($request)) {
            $user = $this->completePendingLogin($request);
        }

        return [
            'user' => $user->loadMissing(['tenant', 'roles.permissions']),
            'recovery_codes' => $codes,
        ];
    }

    public function verifyChallenge(Request $request, ?string $code, ?string $recoveryCode): User
    {
        $user = $this->pendingUser($request);

        if ($recoveryCode && $this->consumeRecoveryCode($user, $recoveryCode)) {
            return $this->completePendingLogin($request);
        }

        $method = $this->confirmedTotpMethod($user);

        if (! $method || ! $code || ! $this->totp->verifyCode(decrypt((string) $method->secret), $code)) {
            throw ValidationException::withMessages([
                'code' => [__('auth.invalid_mfa_code')],
            ]);
        }

        $method->forceFill([
            'last_used_at' => now(),
        ])->save();

        return $this->completePendingLogin($request);
    }

    public function startAuthenticatedSetup(Request $request): array
    {
        /** @var User $user */
        $user = $request->user();
        $secret = $this->setupSecret($request);

        return [
            'secret' => $secret,
            'otp_auth_url' => $this->totp->buildOtpAuthUrl($user, $secret),
        ];
    }

    public function regenerateRecoveryCodes(User $user, string $password): array
    {
        $this->assertPassword($user, $password);

        if (! $this->hasConfirmedTotp($user)) {
            throw ValidationException::withMessages([
                'password' => [__('auth.mfa_not_enrolled')],
            ]);
        }

        return $this->replaceRecoveryCodes($user);
    }

    public function disable(User $user, string $password): void
    {
        $this->assertPassword($user, $password);

        UserMfaMethod::query()
            ->where('user_id', $user->getKey())
            ->delete();

        UserRecoveryCode::query()
            ->where('user_id', $user->getKey())
            ->delete();
    }

    public function clearPendingState(Request $request): void
    {
        $request->session()->forget($this->pendingSessionKey());
        $request->session()->forget($this->setupSecretSessionKey());
    }

    public function pendingCookieName(): string
    {
        return (string) config('security.mfa.state_cookie', 'hostinvo_auth_state');
    }

    private function completePendingLogin(Request $request): User
    {
        $pending = $request->session()->get($this->pendingSessionKey(), []);
        $user = $this->pendingUser($request);

        Auth::guard('web')->login($user, (bool) ($pending['remember'] ?? false));
        $request->session()->regenerate();
        $request->session()->forget(TenantContextService::ACTIVE_TENANT_SESSION_KEY);
        $request->session()->forget($this->pendingSessionKey());
        $request->session()->forget($this->setupSecretSessionKey());
        $request->session()->put('tenant_id', $user->tenant_id);
        $user->forceFill([
            'last_login_at' => now(),
        ])->save();

        return $user->loadMissing(['tenant', 'roles.permissions']);
    }

    private function pendingUser(Request $request): User
    {
        $pending = $request->session()->get($this->pendingSessionKey(), []);
        $startedAt = strtotime((string) ($pending['started_at'] ?? ''));

        if (! is_array($pending) || ! filled($pending['user_id'] ?? null) || ! $startedAt) {
            throw ValidationException::withMessages([
                'mfa' => [__('auth.mfa_session_missing')],
            ]);
        }

        if ($startedAt < now()->subMinutes((int) config('security.mfa.pending_minutes', 10))->getTimestamp()) {
            $this->clearPendingState($request);

            throw ValidationException::withMessages([
                'mfa' => [__('auth.mfa_session_missing')],
            ]);
        }

        $user = $this->users->findById((string) $pending['user_id']);

        if (! $user) {
            throw ValidationException::withMessages([
                'mfa' => [__('auth.mfa_session_missing')],
            ]);
        }

        return $user;
    }

    private function hasPendingChallenge(Request $request): bool
    {
        return $request->session()->has($this->pendingSessionKey());
    }

    private function setupSecret(Request $request): string
    {
        $secret = (string) $request->session()->get($this->setupSecretSessionKey(), '');

        if ($secret !== '') {
            return $secret;
        }

        $secret = $this->totp->generateSecret();
        $request->session()->put($this->setupSecretSessionKey(), $secret);

        return $secret;
    }

    private function replaceRecoveryCodes(User $user): array
    {
        UserRecoveryCode::query()
            ->where('user_id', $user->getKey())
            ->delete();

        $plainCodes = [];

        for ($index = 0; $index < (int) config('security.mfa.recovery_codes_count', 8); $index++) {
            $plain = Str::upper(Str::random(4).'-'.Str::random(4));
            $plainCodes[] = $plain;

            UserRecoveryCode::query()->create([
                'user_id' => $user->getKey(),
                'code_hash' => Hash::make($plain),
                'created_at' => now(),
            ]);
        }

        return $plainCodes;
    }

    private function consumeRecoveryCode(User $user, string $plain): bool
    {
        $code = UserRecoveryCode::query()
            ->where('user_id', $user->getKey())
            ->whereNull('used_at')
            ->get()
            ->first(fn (UserRecoveryCode $item) => Hash::check($plain, $item->code_hash));

        if (! $code) {
            return false;
        }

        $code->forceFill([
            'used_at' => now(),
        ])->save();

        return true;
    }

    private function confirmedTotpMethod(User $user): ?UserMfaMethod
    {
        return $user->mfaMethods()
            ->where('type', UserMfaMethod::TYPE_TOTP)
            ->whereNotNull('confirmed_at')
            ->whereNull('disabled_at')
            ->latest('confirmed_at')
            ->first();
    }

    private function assertPassword(User $user, string $password): void
    {
        if (! Hash::check($password, (string) $user->password)) {
            throw ValidationException::withMessages([
                'password' => [__('auth.current_password_invalid')],
            ]);
        }
    }

    private function pendingSessionKey(): string
    {
        return (string) config('security.mfa.pending_session_key', 'auth.mfa.pending');
    }

    private function setupSecretSessionKey(): string
    {
        return (string) config('security.mfa.setup_secret_session_key', 'auth.mfa.setup_secret');
    }
}
