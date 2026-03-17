<?php

namespace App\Services\Licensing;

use App\Contracts\Licensing\LicenseVerifierInterface;
use App\Models\License;
use App\Services\Licensing\Data\LicenseVerificationResult;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Throwable;

class RemoteLicenseVerifier implements LicenseVerifierInterface
{
    public function verify(
        License $license,
        string $domain,
        string $instanceFingerprint,
    ): LicenseVerificationResult {
        $authorityUrl = config('licensing.verification.authority_url');

        if (blank($authorityUrl)) {
            return config('licensing.verification.allow_local_validation_without_authority', true)
                ? LicenseVerificationResult::skipped(__('licensing.messages.local_only'))
                : LicenseVerificationResult::unavailable(__('licensing.errors.verification_unavailable'));
        }

        try {
            $response = Http::acceptJson()
                ->timeout((int) config('licensing.verification.timeout_seconds', 5))
                ->post($authorityUrl, [
                    'license_key' => $license->license_key,
                    'license_type' => $license->effectivePlan(),
                    'domain' => $domain,
                    'instance_fingerprint' => $instanceFingerprint,
                    'owner_email' => $license->owner_email,
                    'status' => $license->status,
                    'expires_at' => $license->expires_at?->toIso8601String(),
                ]);
        } catch (Throwable) {
            return LicenseVerificationResult::unavailable(__('licensing.errors.verification_unavailable'));
        }

        if ($response->serverError()) {
            return LicenseVerificationResult::unavailable(__('licensing.errors.verification_unavailable'));
        }

        $payload = $response->json();
        $data = is_array($payload) ? (Arr::get($payload, 'data', $payload) ?: []) : [];
        $valid = Arr::get($data, 'valid');
        $message = Arr::get($data, 'message')
            ?? Arr::get($payload, 'message')
            ?? Arr::get($data, 'error');

        if ($valid === true) {
            return LicenseVerificationResult::verified(
                is_array($data) ? $data : [],
                $message
            );
        }

        if ($response->successful()) {
            return LicenseVerificationResult::invalid(
                $message ?? __('licensing.errors.invalid_key'),
                is_array($data) ? $data : []
            );
        }

        return LicenseVerificationResult::unavailable(
            $message ?? __('licensing.errors.verification_unavailable'),
            is_array($data) ? $data : []
        );
    }
}
