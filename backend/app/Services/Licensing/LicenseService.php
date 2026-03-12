<?php

namespace App\Services\Licensing;

use App\Models\License;
use App\Models\LicenseActivation;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LicenseService
{
    /**
     * @return array<string, mixed>
     */
    public function validateLicense(string $licenseKey, string $domain): array
    {
        $normalizedDomain = $this->normalizeDomain($domain);
        $license = License::query()
            ->where('license_key', trim($licenseKey))
            ->first();

        if (! $license) {
            return [
                'valid' => false,
                'error' => 'License key is invalid.',
                'license' => null,
            ];
        }

        $boundDomain = $this->resolveBoundDomain($license);

        if ($boundDomain !== null && $boundDomain !== $normalizedDomain) {
            return $this->validationResponse(
                valid: false,
                license: $license,
                domain: $normalizedDomain,
                boundDomain: $boundDomain,
                error: 'License is bound to a different domain.',
            );
        }

        if (! $license->isActive()) {
            $error = $license->isExpired()
                ? 'License has expired.'
                : 'License is not active.';

            return $this->validationResponse(
                valid: false,
                license: $license,
                domain: $normalizedDomain,
                boundDomain: $boundDomain,
                error: $error,
            );
        }

        return $this->validationResponse(
            valid: true,
            license: $license,
            domain: $normalizedDomain,
            boundDomain: $boundDomain,
        );
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
        $validation = $this->validateLicense($licenseKey, $domain);

        if (! (bool) ($validation['valid'] ?? false)) {
            throw ValidationException::withMessages([
                'license_key' => [$validation['error'] ?? 'The license key is invalid.'],
            ]);
        }

        /** @var License $license */
        $license = License::query()
            ->where('license_key', trim($licenseKey))
            ->firstOrFail();

        $normalizedDomain = $this->normalizeDomain($domain);
        $normalizedInstanceId = trim($instanceId);
        $activation = LicenseActivation::query()->firstOrNew([
            'license_id' => $license->id,
            'instance_id' => $normalizedInstanceId,
        ]);

        if (! $activation->exists) {
            $activeActivationsCount = $license->activations()->active()->count();
            $activationLimit = $license->activation_limit;

            if ($activationLimit !== null && $activeActivationsCount >= $activationLimit) {
                throw ValidationException::withMessages([
                    'instance_id' => ['License activation limit has been reached.'],
                ]);
            }
        }

        $activation->forceFill([
            'tenant_id' => $tenantId,
            'domain' => $normalizedDomain,
            'status' => LicenseActivation::STATUS_ACTIVE,
            'activated_at' => $activation->activated_at ?? now(),
            'last_seen_at' => now(),
            'deactivated_at' => null,
        ]);
        $activation->save();

        if ($tenantId !== null && $license->tenant_id === null) {
            $license->tenant_id = $tenantId;
        }

        $license->last_validated_at = now();
        $license->save();

        return [
            'message' => 'License activated successfully.',
            'license' => $this->formatLicense($license, $normalizedDomain, $this->resolveBoundDomain($license)),
            'activation' => [
                'id' => $activation->id,
                'instance_id' => $activation->instance_id,
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
                'license_key' => ['License must be active before assigning it to a tenant.'],
            ]);
        }

        if ($license->tenant_id !== null && $license->tenant_id !== $tenantId) {
            throw ValidationException::withMessages([
                'license_key' => ['This license is already assigned to another tenant.'],
            ]);
        }

        $license->tenant_id = $tenantId;
        $license->last_validated_at = now();
        $license->save();

        return $this->formatLicense($license, null, $this->resolveBoundDomain($license));
    }

    private function resolveLicense(string $licenseKey): License
    {
        $license = License::query()
            ->where('license_key', trim($licenseKey))
            ->first();

        if (! $license) {
            throw ValidationException::withMessages([
                'license_key' => ['License key is invalid.'],
            ]);
        }

        return $license;
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

    private function resolveBoundDomain(License $license): ?string
    {
        $firstActivation = $license->activations()
            ->orderBy('activated_at')
            ->first();

        return $firstActivation?->domain;
    }

    /**
     * @return array<string, mixed>
     */
    private function validationResponse(
        bool $valid,
        ?License $license,
        ?string $domain,
        ?string $boundDomain,
        ?string $error = null
    ): array {
        return [
            'valid' => $valid,
            'error' => $error,
            'license' => $license ? $this->formatLicense($license, $domain, $boundDomain) : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatLicense(License $license, ?string $domain, ?string $boundDomain): array
    {
        $activeActivations = $license->activations()->active()->count();
        $remaining = $license->activation_limit !== null
            ? max(0, $license->activation_limit - $activeActivations)
            : null;
        $planDefaults = (array) config('licensing.plans.'.$license->plan, []);

        return [
            'id' => $license->id,
            'license_key' => $license->license_key,
            'owner_email' => $license->owner_email,
            'plan' => $license->plan,
            'status' => $license->status,
            'domain' => $domain,
            'bound_domain' => $boundDomain,
            'max_clients' => $license->max_clients ?? Arr::get($planDefaults, 'max_clients'),
            'max_services' => $license->max_services ?? Arr::get($planDefaults, 'max_services'),
            'activation_limit' => $license->activation_limit ?? Arr::get($planDefaults, 'activation_limit'),
            'active_activations' => $activeActivations,
            'remaining_activations' => $remaining,
            'issued_at' => $license->issued_at?->toIso8601String(),
            'expires_at' => $license->expires_at?->toIso8601String(),
            'is_expired' => $license->isExpired(),
        ];
    }
}
