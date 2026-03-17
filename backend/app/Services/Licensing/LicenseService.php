<?php

namespace App\Services\Licensing;

use App\Contracts\Licensing\LicenseVerifierInterface;
use App\Models\Client;
use App\Models\License;
use App\Models\LicenseActivation;
use App\Services\Licensing\Data\LicenseVerificationResult;
use Carbon\CarbonInterface;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LicenseService
{
    public function __construct(
        private readonly LicenseVerifierInterface $verifier,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function validateLicense(
        string $licenseKey,
        string $domain,
        ?string $instanceFingerprint = null,
    ): array {
        $normalizedDomain = $this->normalizeDomain($domain);
        $normalizedFingerprint = $this->normalizeFingerprint(
            $instanceFingerprint ?: $this->buildInstallationFingerprint($normalizedDomain)
        );

        $license = License::query()
            ->where('license_key', trim($licenseKey))
            ->first();

        if (! $license) {
            $this->logValidationFailure('invalid_key', [
                'license_key' => trim($licenseKey),
                'domain' => $normalizedDomain,
                'instance_fingerprint' => $normalizedFingerprint,
            ]);

            return [
                'valid' => false,
                'error' => __('licensing.errors.invalid_key'),
                'license' => null,
            ];
        }

        $boundDomain = $license->bound_domain ?: $this->resolveBoundDomain($license);
        $boundFingerprint = $license->instance_fingerprint ?: $this->resolveBoundFingerprint($license);

        if ($boundDomain !== null && $boundDomain !== $normalizedDomain) {
            return $this->invalidValidationResponse(
                $license,
                $normalizedDomain,
                $boundDomain,
                __('licensing.errors.domain_mismatch'),
                $normalizedFingerprint,
                $boundFingerprint,
                'domain_mismatch',
            );
        }

        if ($boundFingerprint !== null && $boundFingerprint !== $normalizedFingerprint) {
            return $this->invalidValidationResponse(
                $license,
                $normalizedDomain,
                $boundDomain,
                __('licensing.errors.fingerprint_mismatch'),
                $normalizedFingerprint,
                $boundFingerprint,
                'fingerprint_mismatch',
            );
        }

        if (! $license->isActive()) {
            $error = $license->isExpired()
                ? __('licensing.errors.expired')
                : __('licensing.errors.inactive');

            return $this->invalidValidationResponse(
                $license,
                $normalizedDomain,
                $boundDomain,
                $error,
                $normalizedFingerprint,
                $boundFingerprint,
                $license->isExpired() ? 'expired' : 'inactive',
            );
        }

        $verification = $this->verifier->verify($license, $normalizedDomain, $normalizedFingerprint);

        if ($verification->status === LicenseVerificationResult::STATUS_INVALID) {
            return $this->invalidValidationResponse(
                $license,
                $normalizedDomain,
                $boundDomain,
                $verification->message ?? __('licensing.errors.invalid_key'),
                $normalizedFingerprint,
                $boundFingerprint,
                'remote_invalid',
            );
        }

        if ($verification->status === LicenseVerificationResult::STATUS_UNAVAILABLE && ! $license->withinGracePeriod()) {
            return $this->invalidValidationResponse(
                $license,
                $normalizedDomain,
                $boundDomain,
                __('licensing.errors.verification_grace_expired'),
                $normalizedFingerprint,
                $boundFingerprint,
                'verification_grace_expired',
            );
        }

        if ($verification->status === LicenseVerificationResult::STATUS_VERIFIED) {
            $this->syncRemoteLicenseState($license, $verification->payload);
        }

        $verificationMode = match ($verification->status) {
            LicenseVerificationResult::STATUS_VERIFIED => 'remote',
            LicenseVerificationResult::STATUS_UNAVAILABLE => 'grace',
            default => 'local',
        };

        $verificationMessage = $verification->status === LicenseVerificationResult::STATUS_UNAVAILABLE
            ? __('licensing.messages.grace_mode')
            : $verification->message;

        $this->touchVerification(
            $license,
            $normalizedDomain,
            $normalizedFingerprint,
            $verificationMode,
        );

        return [
            'valid' => true,
            'error' => null,
            'license' => $this->formatLicense(
                $license,
                $normalizedDomain,
                $license->bound_domain ?: $boundDomain,
                $normalizedFingerprint,
                $verificationMode,
                $verificationMessage,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function activateLicense(
        string $licenseKey,
        string $domain,
        string $instanceId,
        ?string $tenantId = null,
    ): array {
        $normalizedDomain = $this->normalizeDomain($domain);
        $normalizedFingerprint = $this->normalizeFingerprint($instanceId);
        $validation = $this->validateLicense($licenseKey, $normalizedDomain, $normalizedFingerprint);

        if (! (bool) ($validation['valid'] ?? false)) {
            throw ValidationException::withMessages([
                'license_key' => [$validation['error'] ?? __('licensing.errors.invalid_key')],
            ]);
        }

        $license = $this->resolveLicense($licenseKey);

        if ($tenantId !== null && $license->tenant_id !== null && $license->tenant_id !== $tenantId) {
            throw ValidationException::withMessages([
                'license_key' => [__('licensing.errors.tenant_already_assigned')],
            ]);
        }

        $activation = LicenseActivation::query()
            ->where('license_id', $license->id)
            ->where('instance_id', trim($instanceId))
            ->first() ?? new LicenseActivation();

        if (! $activation->exists) {
            $this->ensureActivationCapacity($license);

            if ($license->isTrial()) {
                $this->ensureTrialIsNotReused($license, $normalizedDomain, $normalizedFingerprint);
            }
        }

        $activation->license_id = $license->id;
        $activation->tenant_id = $tenantId;
        $activation->domain = $normalizedDomain;
        $activation->instance_id = trim($instanceId);
        $activation->instance_fingerprint = $normalizedFingerprint;
        $activation->status = LicenseActivation::STATUS_ACTIVE;
        $activation->activated_at = $activation->activated_at ?? now();
        $activation->last_seen_at = now();
        $activation->deactivated_at = null;
        $activation->save();

        if ($tenantId !== null && $license->tenant_id === null) {
            $license->tenant_id = $tenantId;
        }

        if (blank($license->license_type)) {
            $license->license_type = $license->plan;
        }

        $license->bound_domain ??= $normalizedDomain;
        $license->instance_fingerprint ??= $normalizedFingerprint;
        $license->save();

        return [
            'message' => __('licensing.messages.activated'),
            'license' => $this->formatLicense(
                $license,
                $normalizedDomain,
                $license->bound_domain,
                $normalizedFingerprint,
                (string) Arr::get($license->metadata ?? [], 'verification_mode', 'local'),
                null,
            ),
            'activation' => [
                'id' => $activation->id,
                'instance_id' => $activation->instance_id,
                'instance_fingerprint' => $activation->instance_fingerprint,
                'domain' => $activation->domain,
                'status' => $activation->status,
                'activated_at' => $activation->activated_at?->toIso8601String(),
                'last_seen_at' => $activation->last_seen_at?->toIso8601String(),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function issueTrialLicense(
        string $ownerEmail,
        string $domain,
        string $instanceFingerprint,
        ?string $tenantId = null,
    ): array {
        $normalizedDomain = $this->normalizeDomain($domain);
        $normalizedFingerprint = $this->normalizeFingerprint(
            $instanceFingerprint ?: $this->buildInstallationFingerprint($normalizedDomain)
        );

        $this->ensureTrialIsNotReused(null, $normalizedDomain, $normalizedFingerprint);

        $planDefaults = $this->planDefaults(License::PLAN_FREE_TRIAL);
        $issuedAt = now();
        $license = new License();
        $license->forceFill([
            'tenant_id' => $tenantId,
            'license_key' => $this->generateTrialLicenseKey(),
            'owner_email' => Str::lower(trim($ownerEmail)),
            'license_type' => License::PLAN_FREE_TRIAL,
            'plan' => License::PLAN_FREE_TRIAL,
            'status' => License::STATUS_ACTIVE,
            'bound_domain' => $normalizedDomain,
            'instance_fingerprint' => $normalizedFingerprint,
            'max_clients' => Arr::get($planDefaults, 'max_clients'),
            'max_services' => Arr::get($planDefaults, 'max_services'),
            'activation_limit' => Arr::get($planDefaults, 'activation_limit'),
            'issued_at' => $issuedAt,
            'expires_at' => $issuedAt->copy()->addDays((int) Arr::get($planDefaults, 'duration_days', 7)),
            'last_validated_at' => $issuedAt,
            'last_verified_at' => $issuedAt,
            'verification_grace_ends_at' => $issuedAt->copy()->addHours($this->gracePeriodHours()),
            'metadata' => [
                'verification_mode' => 'local',
                'source' => 'auto_trial',
            ],
        ]);
        $license->save();

        $activation = new LicenseActivation();
        $activation->license_id = $license->id;
        $activation->tenant_id = $tenantId;
        $activation->domain = $normalizedDomain;
        $activation->instance_id = $normalizedFingerprint;
        $activation->instance_fingerprint = $normalizedFingerprint;
        $activation->status = LicenseActivation::STATUS_ACTIVE;
        $activation->activated_at = $issuedAt;
        $activation->last_seen_at = $issuedAt;
        $activation->save();

        return [
            'message' => __('licensing.messages.trial_issued'),
            'license' => $this->formatLicense(
                $license,
                $normalizedDomain,
                $normalizedDomain,
                $normalizedFingerprint,
                'local',
                __('licensing.messages.local_only'),
            ),
            'activation' => [
                'id' => $activation->id,
                'instance_id' => $activation->instance_id,
                'instance_fingerprint' => $activation->instance_fingerprint,
                'domain' => $activation->domain,
                'status' => $activation->status,
                'activated_at' => $activation->activated_at?->toIso8601String(),
                'last_seen_at' => $activation->last_seen_at?->toIso8601String(),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function assignLicenseToTenant(string $licenseKey, string $tenantId): array
    {
        $license = $this->resolveLicense($licenseKey);

        if (! $license->isActive()) {
            throw ValidationException::withMessages([
                'license_key' => [__('licensing.errors.inactive')],
            ]);
        }

        if ($license->tenant_id !== null && $license->tenant_id !== $tenantId) {
            throw ValidationException::withMessages([
                'license_key' => [__('licensing.errors.tenant_already_assigned')],
            ]);
        }

        $license->tenant_id = $tenantId;
        $license->save();

        return $this->formatLicense(
            $license,
            $license->bound_domain,
            $license->bound_domain,
            $license->instance_fingerprint,
            (string) Arr::get($license->metadata ?? [], 'verification_mode', 'local'),
            null,
        );
    }

    public function enforceClientLimitForTenant(?string $tenantId): void
    {
        if (blank($tenantId)) {
            return;
        }

        $license = $this->currentTenantLicense($tenantId);

        if (! $license) {
            return;
        }

        if (! $license->isActive()) {
            throw ValidationException::withMessages([
                'license' => [__('licensing.errors.license_required')],
            ]);
        }

        $maxClients = $license->max_clients ?? Arr::get(
            $this->planDefaults($license->effectivePlan()),
            'max_clients'
        );

        if ($maxClients === null) {
            return;
        }

        $currentClients = Client::query()
            ->where('tenant_id', $tenantId)
            ->count();

        if ($currentClients >= $maxClients) {
            $planLabel = (string) Arr::get(
                $this->planDefaults($license->effectivePlan()),
                'label',
                Str::headline($license->effectivePlan())
            );

            Log::warning('license.client_limit_exceeded', [
                'tenant_id' => $tenantId,
                'license_id' => $license->id,
                'license_type' => $license->effectivePlan(),
                'max_clients' => $maxClients,
                'current_clients' => $currentClients,
            ]);

            throw ValidationException::withMessages([
                'license' => [__('licensing.errors.client_limit_exceeded', [
                    'plan' => $planLabel,
                    'limit' => $maxClients,
                ])],
            ]);
        }
    }

    private function resolveLicense(string $licenseKey): License
    {
        $license = License::query()
            ->where('license_key', trim($licenseKey))
            ->first();

        if (! $license) {
            throw ValidationException::withMessages([
                'license_key' => [__('licensing.errors.invalid_key')],
            ]);
        }

        return $license;
    }

    private function currentTenantLicense(string $tenantId): ?License
    {
        return License::query()
            ->where('tenant_id', $tenantId)
            ->orderByRaw('CASE WHEN status = ? THEN 0 ELSE 1 END', [License::STATUS_ACTIVE])
            ->orderByRaw('CASE WHEN COALESCE(license_type, plan) = ? THEN 1 ELSE 0 END', [License::PLAN_FREE_TRIAL])
            ->latest('issued_at')
            ->latest('created_at')
            ->first();
    }

    private function normalizeDomain(string $domain): string
    {
        $trimmed = Str::lower(trim($domain));

        $host = parse_url($trimmed, PHP_URL_HOST);

        if (is_string($host) && $host !== '') {
            return $host;
        }

        return preg_replace('/:\d+$/', '', $trimmed) ?? $trimmed;
    }

    private function normalizeFingerprint(string $instanceFingerprint): string
    {
        return Str::lower(trim($instanceFingerprint));
    }

    private function buildInstallationFingerprint(string $domain): string
    {
        return substr(hash('sha256', $domain.'|'.config('app.url')), 0, 40);
    }

    private function ensureActivationCapacity(License $license): void
    {
        $activeActivationsCount = $license->activations()->active()->count();
        $activationLimit = $license->activation_limit
            ?? Arr::get($this->planDefaults($license->effectivePlan()), 'activation_limit');

        if ($activationLimit !== null && $activeActivationsCount >= $activationLimit) {
            throw ValidationException::withMessages([
                'instance_id' => [__('licensing.errors.activation_limit_reached')],
            ]);
        }
    }

    private function ensureTrialIsNotReused(
        ?License $license,
        string $domain,
        string $instanceFingerprint,
    ): void {
        $query = LicenseActivation::query()
            ->where(function ($query) use ($domain, $instanceFingerprint): void {
                $query
                    ->where('domain', $domain)
                    ->orWhere('instance_fingerprint', $instanceFingerprint);
            })
            ->whereHas('license', function ($query): void {
                $query->where(function ($inner): void {
                    $inner
                        ->where('license_type', License::PLAN_FREE_TRIAL)
                        ->orWhere('plan', License::PLAN_FREE_TRIAL);
                });
            });

        if ($license) {
            $query->where('license_id', '!=', $license->id);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'license' => [__('licensing.errors.trial_reuse')],
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function syncRemoteLicenseState(License $license, array $payload): void
    {
        $licensePayload = Arr::get($payload, 'license');
        $licenseData = is_array($licensePayload) ? $licensePayload : $payload;

        if (! is_array($licenseData)) {
            return;
        }

        $license->status = in_array((string) Arr::get($licenseData, 'status'), License::statuses(), true)
            ? (string) Arr::get($licenseData, 'status')
            : $license->status;

        $licenseType = (string) (Arr::get($licenseData, 'license_type') ?? Arr::get($licenseData, 'plan'));

        if ($licenseType !== '') {
            $license->license_type = $licenseType;
            $license->plan = $licenseType;
        }

        if (($maxClients = Arr::get($licenseData, 'max_clients')) !== null) {
            $license->max_clients = (int) $maxClients;
        }

        if (($maxServices = Arr::get($licenseData, 'max_services')) !== null) {
            $license->max_services = (int) $maxServices;
        }

        if (($boundDomain = Arr::get($licenseData, 'bound_domain')) !== null) {
            $license->bound_domain = $this->normalizeDomain((string) $boundDomain);
        }

        if (($instanceFingerprint = Arr::get($licenseData, 'instance_fingerprint')) !== null) {
            $license->instance_fingerprint = $this->normalizeFingerprint((string) $instanceFingerprint);
        }

        if (($expiresAt = $this->parseDateValue(Arr::get($licenseData, 'expires_at'))) !== null) {
            $license->expires_at = $expiresAt;
        }
    }

    private function touchVerification(
        License $license,
        string $domain,
        string $instanceFingerprint,
        string $verificationMode,
    ): void {
        $metadata = (array) ($license->metadata ?? []);
        $metadata['verification_mode'] = $verificationMode;

        $license->forceFill([
            'license_type' => $license->license_type ?: $license->plan,
            'bound_domain' => $license->bound_domain ?: $domain,
            'instance_fingerprint' => $license->instance_fingerprint ?: $instanceFingerprint,
            'last_validated_at' => now(),
            'last_verified_at' => $verificationMode !== 'grace' ? now() : $license->last_verified_at,
            'verification_grace_ends_at' => now()->addHours($this->gracePeriodHours()),
            'metadata' => $metadata,
        ]);
        $license->save();
    }

    /**
     * @return array<string, mixed>
     */
    private function invalidValidationResponse(
        License $license,
        string $domain,
        ?string $boundDomain,
        string $error,
        string $instanceFingerprint,
        ?string $boundFingerprint,
        string $reason,
    ): array {
        $this->logValidationFailure($reason, [
            'license_id' => $license->id,
            'tenant_id' => $license->tenant_id,
            'license_type' => $license->effectivePlan(),
            'domain' => $domain,
            'bound_domain' => $boundDomain,
            'instance_fingerprint' => $instanceFingerprint,
            'bound_instance_fingerprint' => $boundFingerprint,
        ]);

        return [
            'valid' => false,
            'error' => $error,
            'license' => $this->formatLicense(
                $license,
                $domain,
                $boundDomain,
                $instanceFingerprint,
                (string) Arr::get($license->metadata ?? [], 'verification_mode', 'local'),
                null,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatLicense(
        License $license,
        ?string $domain,
        ?string $boundDomain,
        ?string $instanceFingerprint,
        ?string $verificationMode,
        ?string $verificationMessage,
    ): array {
        $plan = $license->effectivePlan();
        $planDefaults = $this->planDefaults($plan);
        $activeActivations = $license->activations()->active()->count();
        $remaining = $license->activation_limit !== null
            ? max(0, $license->activation_limit - $activeActivations)
            : ($planDefaults['activation_limit'] ?? null);
        $maxClients = $license->max_clients ?? Arr::get($planDefaults, 'max_clients');
        $clientCount = $license->tenant_id
            ? Client::query()->where('tenant_id', $license->tenant_id)->count()
            : null;

        return [
            'id' => $license->id,
            'license_key' => $license->license_key,
            'owner_email' => $license->owner_email,
            'plan' => $plan,
            'license_type' => $plan,
            'status' => $license->status,
            'domain' => $domain,
            'bound_domain' => $boundDomain,
            'instance_fingerprint' => $license->instance_fingerprint ?: $instanceFingerprint,
            'max_clients' => $maxClients,
            'max_services' => $license->max_services ?? Arr::get($planDefaults, 'max_services'),
            'activation_limit' => $license->activation_limit ?? Arr::get($planDefaults, 'activation_limit'),
            'active_activations' => $activeActivations,
            'remaining_activations' => $remaining,
            'issued_at' => $license->issued_at?->toIso8601String(),
            'expires_at' => $license->expires_at?->toIso8601String(),
            'last_verified_at' => $license->last_verified_at?->toIso8601String(),
            'verification_grace_ends_at' => $license->verification_grace_ends_at?->toIso8601String(),
            'is_expired' => $license->isExpired(),
            'is_trial' => $license->isTrial(),
            'verification_mode' => $verificationMode,
            'verification_message' => $verificationMessage,
            'client_count' => $clientCount,
            'client_limit_exceeded' => $maxClients !== null && $clientCount !== null
                ? $clientCount > $maxClients
                : false,
        ];
    }

    private function resolveBoundDomain(License $license): ?string
    {
        return $license->activations()
            ->orderBy('activated_at')
            ->value('domain');
    }

    private function resolveBoundFingerprint(License $license): ?string
    {
        return $license->activations()
            ->orderBy('activated_at')
            ->value('instance_fingerprint');
    }

    /**
     * @return array<string, mixed>
     */
    private function planDefaults(string $plan): array
    {
        return (array) config('licensing.plans.'.$plan, []);
    }

    private function gracePeriodHours(): int
    {
        return (int) config('licensing.verification.grace_period_hours', 72);
    }

    private function generateTrialLicenseKey(): string
    {
        do {
            $licenseKey = sprintf(
                'HOST-TRIAL-%s-%s',
                Str::upper(Str::random(4)),
                Str::upper(Str::random(4)),
            );
        } while (License::query()->where('license_key', $licenseKey)->exists());

        return $licenseKey;
    }

    private function parseDateValue(mixed $value): ?CarbonInterface
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function logValidationFailure(string $reason, array $context): void
    {
        Log::warning('license.validation_failed', array_merge($context, [
            'reason' => $reason,
        ]));
    }
}
