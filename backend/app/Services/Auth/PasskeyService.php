<?php

namespace App\Services\Auth;

use App\Models\Role;
use App\Models\User;
use App\Models\UserMfaMethod;
use App\Models\UserWebauthnCredential;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use WebAuthn\WebAuthn;

class PasskeyService
{
    private const REGISTRATION_CHALLENGE_KEY = 'auth.passkeys.registration.challenge';
    private const AUTH_CHALLENGE_KEY = 'auth.passkeys.authentication.challenge';
    private const AUTH_ALLOW_KEY = 'auth.passkeys.authentication.allowed_credentials';

    public function __construct(
        private readonly MfaService $mfa,
    ) {
    }

    public function registrationOptions(User $user, Request $request): array
    {
        $this->assertSuperAdmin($user);

        $webauthn = $this->webauthn($request);
        $exclude = $user->webauthnCredentials()
            ->get()
            ->map(fn (UserWebauthnCredential $cred): string => $this->base64UrlDecode($cred->credential_id))
            ->values()
            ->all();

        $options = $webauthn->getCreateArgs(
            $user->getKey(),
            $user->email,
            $user->name,
            $this->requireResidentKey(),
            $this->userVerification(),
            null,
            $exclude,
        );

        $request->session()->put(self::REGISTRATION_CHALLENGE_KEY, $this->base64UrlEncode($webauthn->getChallenge()));

        return [
            'publicKey' => $options,
        ];
    }

    public function register(User $user, array $credential, ?string $label, Request $request): UserWebauthnCredential
    {
        $this->assertSuperAdmin($user);

        $challenge = $this->getChallengeFromSession($request, self::REGISTRATION_CHALLENGE_KEY);

        $webauthn = $this->webauthn($request);
        $data = $webauthn->processCreate(
            $this->decodeCredentialComponent($credential, 'response.clientDataJSON'),
            $this->decodeCredentialComponent($credential, 'response.attestationObject'),
            $this->base64UrlDecode($challenge),
            $this->requireResidentKey(),
            $this->userVerification(),
        );

        $credentialIdBinary = $data->credentialId;
        $credentialId = $credentialIdBinary instanceof \WebAuthn\Binary\ByteBuffer
            ? $this->base64UrlEncode($credentialIdBinary->getBinaryString())
            : $this->base64UrlEncode((string) $credentialIdBinary);

        if (UserWebauthnCredential::query()->where('credential_id', $credentialId)->exists()) {
            throw ValidationException::withMessages([
                'credential' => ['This passkey is already registered.'],
            ]);
        }

        $method = UserMfaMethod::query()->create([
            'user_id' => $user->getKey(),
            'type' => UserMfaMethod::TYPE_WEBAUTHN,
            'label' => $label ?: 'Passkey',
            'metadata' => [
                'rp_id' => $this->rpId($request),
            ],
            'confirmed_at' => now(),
            'last_used_at' => now(),
        ]);

        $credentialRecord = UserWebauthnCredential::query()->create([
            'user_id' => $user->getKey(),
            'mfa_method_id' => $method->getKey(),
            'credential_id' => $credentialId,
            'public_key' => (string) $data->credentialPublicKey,
            'sign_count' => (int) ($data->signatureCounter ?? 0),
            'aaguid' => $this->normalizeBinary($data->aaguid ?? null),
            'transports' => Arr::get($credential, 'transports', []),
            'last_used_at' => now(),
        ]);

        $request->session()->forget(self::REGISTRATION_CHALLENGE_KEY);

        return $credentialRecord->loadMissing('method');
    }

    public function authenticationOptions(?User $user, Request $request): array
    {
        if ($user) {
            $this->assertSuperAdmin($user);
        }

        $webauthn = $this->webauthn($request);
        $allowCredentials = [];

        if ($user) {
            $allowCredentials = $user->webauthnCredentials()
                ->get()
                ->map(fn (UserWebauthnCredential $cred): string => $this->base64UrlDecode($cred->credential_id))
                ->values()
                ->all();
        }

        $options = $webauthn->getGetArgs(
            $allowCredentials,
            $this->userVerification(),
        );

        $request->session()->put(self::AUTH_CHALLENGE_KEY, $this->base64UrlEncode($webauthn->getChallenge()));
        $request->session()->put(self::AUTH_ALLOW_KEY, array_map([$this, 'base64UrlEncode'], $allowCredentials));

        return [
            'publicKey' => $options,
        ];
    }

    public function authenticate(array $credential, Request $request): User
    {
        $challenge = $this->getChallengeFromSession($request, self::AUTH_CHALLENGE_KEY);
        $credentialId = $this->extractCredentialId($credential);

        $record = UserWebauthnCredential::query()
            ->with(['user', 'method'])
            ->where('credential_id', $credentialId)
            ->first();

        if (! $record || ! $record->user) {
            throw ValidationException::withMessages([
                'credential' => ['Passkey not recognized.'],
            ]);
        }

        $user = $record->user;
        $this->assertSuperAdmin($user);
        $this->ensureLoginAllowed($user);

        $allowed = $request->session()->get(self::AUTH_ALLOW_KEY, []);
        if (! empty($allowed) && ! in_array($credentialId, $allowed, true)) {
            throw ValidationException::withMessages([
                'credential' => ['Passkey not authorized for this login.'],
            ]);
        }

        $webauthn = $this->webauthn($request);

        $webauthn->processGet(
            $this->decodeCredentialComponent($credential, 'response.clientDataJSON'),
            $this->decodeCredentialComponent($credential, 'response.authenticatorData'),
            $this->decodeCredentialComponent($credential, 'response.signature'),
            (string) $record->public_key,
            $this->base64UrlDecode($challenge),
            (int) $record->sign_count,
            $this->userVerification(),
        );

        $record->forceFill([
            'sign_count' => (int) $webauthn->getSignatureCounter(),
            'last_used_at' => now(),
        ])->save();

        $record->method?->forceFill([
            'last_used_at' => now(),
        ])->save();

        $request->session()->forget([self::AUTH_CHALLENGE_KEY, self::AUTH_ALLOW_KEY]);

        if ($this->mfa->hasPendingChallenge($request)) {
            return $this->mfa->completePendingLoginForUser($request, $user);
        }

        return $this->loginUser($request, $user);
    }

    public function listCredentials(User $user): array
    {
        $this->assertSuperAdmin($user);

        return $user->webauthnCredentials()
            ->with('method')
            ->get()
            ->map(fn (UserWebauthnCredential $record): array => [
                'id' => $record->getKey(),
                'label' => $record->method?->label ?? 'Passkey',
                'created_at' => optional($record->created_at)->toIso8601String(),
                'last_used_at' => optional($record->last_used_at)->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    public function renameCredential(User $user, UserWebauthnCredential $credential, string $label): void
    {
        $this->assertSuperAdmin($user);
        $this->assertOwned($user, $credential);

        $credential->method?->forceFill([
            'label' => $label,
        ])->save();
    }

    public function removeCredential(User $user, UserWebauthnCredential $credential, string $currentPassword): void
    {
        $this->assertSuperAdmin($user);
        $this->assertOwned($user, $credential);

        if (! Hash::check($currentPassword, (string) $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => [__('auth.current_password_invalid')],
            ]);
        }

        $remaining = UserMfaMethod::query()
            ->where('user_id', $user->getKey())
            ->whereNull('disabled_at')
            ->whereNotNull('confirmed_at')
            ->whereIn('type', [UserMfaMethod::TYPE_TOTP, UserMfaMethod::TYPE_WEBAUTHN])
            ->count();

        if ($remaining <= 1 && $this->mfa->hasConfirmedTotp($user) === false) {
            throw ValidationException::withMessages([
                'credential' => ['You must keep at least one strong MFA method enabled.'],
            ]);
        }

        $method = $credential->method;
        $credential->delete();
        $method?->delete();
    }

    private function loginUser(Request $request, User $user): User
    {
        Auth::guard('web')->login($user, true);
        $request->session()->regenerate();
        $request->session()->put('tenant_id', $user->tenant_id);
        $user->forceFill(['last_login_at' => now()])->save();

        return $user->loadMissing(['tenant', 'roles.permissions']);
    }

    private function assertSuperAdmin(User $user): void
    {
        if (! $user->hasRole(Role::SUPER_ADMIN)) {
            throw ValidationException::withMessages([
                'passkey' => [__('auth.mfa_not_supported')],
            ]);
        }
    }

    private function ensureLoginAllowed(User $user): void
    {
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
    }

    private function assertOwned(User $user, UserWebauthnCredential $credential): void
    {
        if ((string) $credential->user_id !== (string) $user->getKey()) {
            throw ValidationException::withMessages([
                'credential' => ['Passkey not found.'],
            ]);
        }
    }

    private function webauthn(Request $request): WebAuthn
    {
        $webauthn = new WebAuthn(
            (string) config('security.passkeys.rp_name', config('app.name', 'Hostinvo')),
            $this->rpId($request),
            null,
            true,
        );

        $webauthn->setTimeout((int) config('security.passkeys.timeout', 30));

        return $webauthn;
    }

    private function rpId(Request $request): string
    {
        $configured = (string) config('security.passkeys.rp_id', '');

        if ($configured !== '') {
            return $configured;
        }

        return $request->getHost();
    }

    private function userVerification(): string
    {
        return (string) config('security.passkeys.user_verification', 'required');
    }

    private function requireResidentKey(): bool
    {
        $value = strtolower((string) config('security.passkeys.require_resident_key', 'preferred'));

        return $value === 'required' || $value === 'true' || $value === '1';
    }

    private function getChallengeFromSession(Request $request, string $key): string
    {
        $challenge = (string) $request->session()->get($key, '');

        if ($challenge === '') {
            throw ValidationException::withMessages([
                'credential' => [__('auth.mfa_session_missing')],
            ]);
        }

        return $challenge;
    }

    private function extractCredentialId(array $credential): string
    {
        $raw = Arr::get($credential, 'rawId', Arr::get($credential, 'id'));
        $binary = $this->base64UrlDecode((string) $raw);

        return $this->base64UrlEncode($binary);
    }

    private function decodeCredentialComponent(array $credential, string $path): string
    {
        $value = Arr::get($credential, $path);

        if (! is_string($value) || $value === '') {
            throw ValidationException::withMessages([
                'credential' => ['Invalid passkey response.'],
            ]);
        }

        return $this->base64UrlDecode($value);
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $data): string
    {
        $padding = strlen($data) % 4;
        if ($padding) {
            $data .= str_repeat('=', 4 - $padding);
        }

        return base64_decode(strtr($data, '-_', '+/')) ?: '';
    }

    private function normalizeBinary(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }

        if ($value instanceof \WebAuthn\Binary\ByteBuffer) {
            return $this->base64UrlEncode($value->getBinaryString());
        }

        if (is_string($value)) {
            return $this->base64UrlEncode($value);
        }

        return null;
    }
}
