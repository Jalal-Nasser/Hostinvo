<?php

namespace App\Contracts\Licensing;

use App\Models\License;
use App\Services\Licensing\Data\LicenseVerificationResult;

interface LicenseVerifierInterface
{
    // This is a practical enforcement boundary for self-hosted installs, not a claim
    // that distributed PHP code cannot be modified by a determined operator.
    public function verify(
        License $license,
        string $domain,
        string $instanceFingerprint,
    ): LicenseVerificationResult;
}
