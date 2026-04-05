<?php

namespace App\Services\Licensing;

use App\Contracts\Licensing\LicenseVerifierInterface;
use App\Models\Client;
use App\Models\License;
use App\Models\LicenseActivation;
use App\Services\Licensing\Data\LicenseVerificationResult;
use App\Support\Tenancy\CurrentTenant;
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
        private readonly CurrentTenant $currentTenant,
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
            $instanceFingerprint ?: $this->generateInstallationHash($normalizedDomain)
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
                'reason' => 'invalid_key',
                'message' => __('licensing.errors.invalid_key'),
                'error' => __('licensing.errors.invalid_key'),
                'license' => null,
            ];
        }

        $boundDomain = $license->domain ?: $this->resolveBoundDomain($license);
        $boundFingerprint = $license->installation_hash ?: $this->resolveBoundFingerprint($license);

        if (($reason = $this->checkLicenseState($license)) !== null) {
            return $this->invalidValidationResponse(
                $license,
                $normalizedDomain,
                $boundDomain,
                $this->messageForReason($reason, $license),
                $normalizedFingerprint,
                $boundFingerprint,
                $reason,
            );
        }

        if (($reason = $this->checkDomainBinding($license, $normalizedDomain)) !== null) {
            return $this->invalidValidationResponse(
                $license,
                $normalizedDomain,
                $boundDomain,
                $this->messageForReason($reason, $license),
                $normalizedFingerprint,
                $boundFingerprint,
                $reason,
            );
        }

        if (($reason = $this->checkInstallationBinding($license, $normalizedFingerprint)) !== null) {
            return $this->invalidValidationResponse(
                $license,
                $normalizedDomain,
                $boundDomain,
                $this->messageForReason($reason, $license),
                $normalizedFingerprint,
                $boundFingerprint,
                $reason,
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

        if (($reason = $this->checkClientLimit($license, $license->tenant_id)) !== null) {
            return $this->invalidValidationResponse(
                $license,
                $normalizedDomain,
                $license->domain ?: $boundDomain,
                $this->messageForReason($reason, $license),
                $normalizedFingerprint,
                $license->installation_hash ?: $boundFingerprint,
                $reason,
            );
        }

        return [
            'valid' => true,
            'reason' => null,
            'message' => $verificationMessage,
            'error' => null,
            'license' => $this->formatLicense(
                $license,
                $normalizedDomain,
                $license->domain ?: $boundDomain,
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

        if (blank($license->type)) {
            $license->type = $license->effectivePlan();
        }

        $license->domain ??= $normalizedDomain;
        $license->installation_hash ??= $normalizedFingerprint;
        $license->save();

        return [
            'message' => __('licensing.messages.activated'),
            'license' => $this->formatLicense(
                $license,
                $normalizedDomain,
                $license->domain,
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
            $instanceFingerprint ?: $this->generateInstallationHash($normalizedDomain)
        );

        $this->ensureTrialIsNotReused(null, $normalizedDomain, $normalizedFingerprint);

        $planDefaults = $this->planDefaults(License::PLAN_FREE_TRIAL);
        $issuedAt = now();
        $license = new License();
        $license->forceFill([
            'tenant_id' => $tenantId,
            'license_key' => $this->generateTrialLicenseKey(),
            'owner_email' => Str::lower(trim($ownerEmail)),
            'type' => License::PLAN_FREE_TRIAL,
            'license_type' => License::PLAN_FREE_TRIAL,
            'plan' => License::PLAN_FREE_TRIAL,
            'status' => License::STATUS_ACTIVE,
            'domain' => $normalizedDomain,
            'bound_domain' => $normalizedDomain,
            'installation_hash' => $normalizedFingerprint,
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
            $license->domain,
            $license->domain,
            $license->installation_hash,
            (string) Arr::get($license->metadata ?? [], 'verification_mode', 'local'),
            null,
        );
    }

    public function getCurrentLicense(?string $tenantId = null): ?License
    {
        $resolvedTenantId = $tenantId
            ?? $this->currentTenant->id()
            ?? request()?->user()?->tenant_id;

        if (blank($resolvedTenantId)) {
            return null;
        }

        return $this->currentTenantLicense($resolvedTenantId);
    }

    /**
     * @return array{valid: bool, reason: string|null, message: string|null, error: string|null, license: array<string, mixed>|null}
     */
    public function validateCurrentLicense(
        ?string $tenantId = null,
        ?string $domain = null,
        ?string $installationHash = null,
    ): array {
        $license = $this->getCurrentLicense($tenantId);
        $resolvedDomain = $this->resolveCurrentDomain($domain);
        $resolvedInstallationHash = $this->normalizeFingerprint(
            $installationHash ?: $this->generateInstallationHash($resolvedDomain)
        );

        if (! $license) {
            $this->logValidationFailure('missing', [
                'tenant_id' => $tenantId ?? $this->currentTenant->id(),
                'domain' => $resolvedDomain,
                'installation_hash' => $resolvedInstallationHash,
            ]);

            return [
                'valid' => false,
                'reason' => 'missing',
                'message' => __('licensing.errors.missing'),
                'error' => __('licensing.errors.missing'),
                'license' => null,
            ];
        }

        $boundDomain = $license->domain ?: $this->resolveBoundDomain($license);
        $boundFingerprint = $license->installation_hash ?: $this->resolveBoundFingerprint($license);

        foreach ([
            $this->checkLicenseState($license),
            $this->checkDomainBinding($license, $resolvedDomain),
            $this->checkInstallationBinding($license, $resolvedInstallationHash),
            $this->checkClientLimit($license, $license->tenant_id),
        ] as $reason) {
            if ($reason === null) {
                continue;
            }

            return $this->invalidValidationResponse(
                $license,
                $resolvedDomain,
                $boundDomain,
                $this->messageForReason($reason, $license),
                $resolvedInstallationHash,
                $boundFingerprint,
                $reason,
            );
        }

        if ($this->hasFreshVerificationCache($license)) {
            $this->touchValidationCache($license, $resolvedDomain, $resolvedInstallationHash);

            return [
                'valid' => true,
                'reason' => null,
                'message' => __('licensing.messages.cached'),
                'error' => null,
                'license' => $this->formatLicense(
                    $license,
                    $resolvedDomain,
                    $license->domain ?: $boundDomain,
                    $resolvedInstallationHash,
                    (string) Arr::get($license->metadata ?? [], 'verification_mode', 'local'),
                    __('licensing.messages.cached'),
                ),
            ];
        }

        $verification = $this->verifier->verify($license, $resolvedDomain, $resolvedInstallationHash);

        if ($verification->status === LicenseVerificationResult::STATUS_INVALID) {
            return $this->invalidValidationResponse(
                $license,
                $resolvedDomain,
                $boundDomain,
                $verification->message ?? __('licensing.errors.invalid_key'),
                $resolvedInstallationHash,
                $boundFingerprint,
                'remote_invalid',
            );
        }

        if ($verification->status === LicenseVerificationResult::STATUS_UNAVAILABLE && ! $license->withinGracePeriod()) {
            return $this->invalidValidationResponse(
                $license,
                $resolvedDomain,
                $boundDomain,
                __('licensing.errors.verification_grace_expired'),
                $resolvedInstallationHash,
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
            : ($verification->message ?: __('licensing.messages.local_only'));

        $this->touchVerification(
            $license,
            $resolvedDomain,
            $resolvedInstallationHash,
            $verificationMode,
        );

        return [
            'valid' => true,
            'reason' => null,
            'message' => $verificationMessage,
            'error' => null,
            'license' => $this->formatLicense(
                $license,
                $resolvedDomain,
                $license->domain ?: $boundDomain,
                $resolvedInstallationHash,
                $verificationMode,
                $verificationMessage,
            ),
        ];
    }

    public function checkExpiration(License $license): ?string
    {
        if ($license->isTrial() && blank($license->expires_at)) {
            return 'trial_expired';
        }

        if (! $license->isExpired()) {
            return null;
        }

        if ($license->status !== License::STATUS_EXPIRED) {
            $license->forceFill([
                'status' => License::STATUS_EXPIRED,
            ])->save();
        }

        return $license->isTrial() ? 'trial_expired' : 'expired';
    }

    public function checkDomainBinding(License $license, ?string $domain = null): ?string
    {
        if (blank($domain)) {
            return null;
        }

        $boundDomain = $license->domain ?: $this->resolveBoundDomain($license);

        if (blank($boundDomain)) {
            return null;
        }

        return $this->normalizeDomain($boundDomain) === $this->normalizeDomain($domain)
            ? null
            : 'domain_mismatch';
    }

    public function checkInstallationBinding(License $license, ?string $installationHash = null): ?string
    {
        if (blank($installationHash)) {
            return null;
        }

        $boundInstallationHash = $license->installation_hash ?: $this->resolveBoundFingerprint($license);

        if (blank($boundInstallationHash)) {
            return null;
        }

        return $this->normalizeFingerprint($boundInstallationHash) === $this->normalizeFingerprint($installationHash)
            ? null
            : 'installation_mismatch';
    }

    public function checkClientLimit(License $license, ?string $tenantId = null): ?string
    {
        $resolvedTenantId = $tenantId ?: $license->tenant_id;

        if (blank($resolvedTenantId)) {
            return null;
        }

        $maxClients = $license->max_clients ?? Arr::get(
            $this->planDefaults($license->effectivePlan()),
            'max_clients'
        );

        if ($maxClients === null) {
            return null;
        }

        return $this->activeClientCount($resolvedTenantId) > $maxClients
            ? 'limit_exceeded'
            : null;
    }

    public function generateInstallationHash(?string $domain = null): string
    {
        $connection = (string) config('database.default');
        $database = (string) config("database.connections.{$connection}.database");
        $host = php_uname('n') ?: gethostname() ?: 'hostinvo';

        return substr(hash('sha256', implode('|', array_filter([
            (string) config('app.key'),
            $database,
            $host,
        ]))), 0, 64);
    }

    public function enforceClientLimitForTenant(?string $tenantId, ?string $nextClientStatus = Client::STATUS_ACTIVE): void
    {
        if (blank($tenantId)) {
            return;
        }

        $license = $this->getCurrentLicense($tenantId);

        if (! $license) {
            throw ValidationException::withMessages([
                'license' => [__('licensing.errors.missing')],
            ]);
        }

        if (($reason = $this->checkLicenseState($license)) !== null) {
            throw ValidationException::withMessages([
                'license' => [$this->messageForReason($reason, $license)],
            ]);
        }

        $maxClients = $license->max_clients ?? Arr::get(
            $this->planDefaults($license->effectivePlan()),
            'max_clients'
        );

        if ($maxClients === null) {
            return;
        }

        if (($nextClientStatus ?? Client::STATUS_ACTIVE) !== Client::STATUS_ACTIVE) {
            return;
        }

        $currentClients = $this->activeClientCount($tenantId);

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
        return $this->generateInstallationHash($domain);
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

        $licenseType = (string) (Arr::get($licenseData, 'type') ?? Arr::get($licenseData, 'license_type') ?? Arr::get($licenseData, 'plan'));

        if ($licenseType !== '') {
            $license->type = $licenseType;
        }

        if (($maxClients = Arr::get($licenseData, 'max_clients')) !== null) {
            $license->max_clients = (int) $maxClients;
        }

        if (($maxServices = Arr::get($licenseData, 'max_services')) !== null) {
            $license->max_services = (int) $maxServices;
        }

        if (($boundDomain = Arr::get($licenseData, 'domain', Arr::get($licenseData, 'bound_domain'))) !== null) {
            $license->domain = $this->normalizeDomain((string) $boundDomain);
        }

        if (($instanceFingerprint = Arr::get($licenseData, 'installation_hash', Arr::get($licenseData, 'instance_fingerprint'))) !== null) {
            $license->installation_hash = $this->normalizeFingerprint((string) $instanceFingerprint);
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
            'type' => $license->effectivePlan(),
            'domain' => $license->domain ?: $domain,
            'installation_hash' => $license->installation_hash ?: $instanceFingerprint,
            'last_validated_at' => now(),
            'last_verified_at' => $verificationMode !== 'grace' ? now() : $license->last_verified_at,
            'verification_grace_ends_at' => now()->addHours($this->gracePeriodHours()),
            'metadata' => $metadata,
        ]);
        $license->save();
    }

    private function touchValidationCache(
        License $license,
        string $domain,
        string $installationHash,
    ): void {
        $metadata = (array) ($license->metadata ?? []);
        $metadata['verification_mode'] = $metadata['verification_mode'] ?? 'local';

        $license->forceFill([
            'type' => $license->effectivePlan(),
            'domain' => $license->domain ?: $domain,
            'installation_hash' => $license->installation_hash ?: $installationHash,
            'last_validated_at' => now(),
            'metadata' => $metadata,
        ])->save();
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
            'reason' => $reason,
            'message' => $error,
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
            ? $this->activeClientCount($license->tenant_id)
            : null;

        return [
            'id' => $license->id,
            'license_key' => $license->license_key,
            'owner_email' => $license->owner_email,
            'type' => $plan,
            'plan' => $plan,
            'license_type' => $plan,
            'status' => $license->status,
            'domain' => $license->domain ?: $domain,
            'bound_domain' => $boundDomain,
            'installation_hash' => $license->installation_hash ?: $instanceFingerprint,
            'instance_fingerprint' => $license->installation_hash ?: $instanceFingerprint,
            'max_clients' => $maxClients,
            'max_services' => $license->max_services ?? Arr::get($planDefaults, 'max_services'),
            'activation_limit' => $license->activation_limit ?? Arr::get($planDefaults, 'activation_limit'),
            'active_activations' => $activeActivations,
            'remaining_activations' => $remaining,
            'issued_at' => $license->issued_at?->toIso8601String(),
            'expires_at' => $license->expires_at?->toIso8601String(),
            'last_validated_at' => $license->last_validated_at?->toIso8601String(),
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

    private function checkLicenseState(License $license): ?string
    {
        if (($expirationReason = $this->checkExpiration($license)) !== null) {
            return $expirationReason;
        }

        return match ($license->status) {
            License::STATUS_SUSPENDED => 'suspended',
            License::STATUS_REVOKED => 'revoked',
            License::STATUS_EXPIRED => $license->isTrial() ? 'trial_expired' : 'expired',
            License::STATUS_ACTIVE => null,
            default => 'inactive',
        };
    }

    private function resolveCurrentDomain(?string $domain = null): string
    {
        $candidate = $domain
            ?: request()?->getHost()
            ?: parse_url((string) config('app.url'), PHP_URL_HOST)
            ?: 'localhost';

        return $this->normalizeDomain((string) $candidate);
    }

    private function hasFreshVerificationCache(License $license): bool
    {
        if (! $license->last_verified_at instanceof CarbonInterface) {
            return false;
        }

        return $license->last_verified_at->greaterThanOrEqualTo(
            now()->subMinutes((int) config('licensing.verification.cache_minutes', 15))
        );
    }

    private function activeClientCount(string $tenantId): int
    {
        return Client::query()
            ->where('tenant_id', $tenantId)
            ->where('status', Client::STATUS_ACTIVE)
            ->count();
    }

    private function messageForReason(string $reason, ?License $license = null): string
    {
        return match ($reason) {
            'invalid_key' => __('licensing.errors.invalid_key'),
            'missing' => __('licensing.errors.missing'),
            'expired' => __('licensing.errors.expired'),
            'trial_expired' => __('licensing.errors.trial_expired'),
            'domain_mismatch' => __('licensing.errors.domain_mismatch'),
            'installation_mismatch', 'fingerprint_mismatch' => __('licensing.errors.installation_mismatch'),
            'suspended' => __('licensing.errors.suspended'),
            'revoked' => __('licensing.errors.revoked'),
            'verification_grace_expired' => __('licensing.errors.verification_grace_expired'),
            'limit_exceeded' => __('licensing.errors.client_limit_exceeded', [
                'plan' => (string) Arr::get(
                    $this->planDefaults($license?->effectivePlan() ?? License::PLAN_STARTER),
                    'label',
                    Str::headline($license?->effectivePlan() ?? License::PLAN_STARTER)
                ),
                'limit' => (int) ($license?->max_clients
                    ?? Arr::get($this->planDefaults($license?->effectivePlan() ?? License::PLAN_STARTER), 'max_clients', 0)),
            ]),
            default => __('licensing.errors.inactive'),
        };
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
        $defaults = (array) config('licensing.plans.'.$plan, []);

        try {
            $overrides = app(\App\Services\Platform\PlatformSettingService::class)
                ->get('licensing_plans', []);
        } catch (\Throwable) {
            $overrides = [];
        }

        $override = [];

        foreach ($overrides as $item) {
            if (is_array($item) && ($item['key'] ?? null) === $plan) {
                $override = $item;
                break;
            }
        }

        return array_replace($defaults, $override);
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
