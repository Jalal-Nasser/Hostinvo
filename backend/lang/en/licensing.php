<?php

return [
    'errors' => [
        'invalid_key' => 'License key is invalid.',
        'inactive' => 'License is not active.',
        'expired' => 'License has expired.',
        'domain_mismatch' => 'License is bound to a different domain.',
        'fingerprint_mismatch' => 'License is bound to a different installation.',
        'activation_limit_reached' => 'License activation limit has been reached.',
        'trial_reuse' => 'A free trial has already been used on this installation.',
        'tenant_already_assigned' => 'This license is already assigned to another tenant.',
        'verification_unavailable' => 'License verification is temporarily unavailable.',
        'verification_grace_expired' => 'License verification could not be completed and the local grace period has expired.',
        'client_limit_exceeded' => 'The :plan license allows up to :limit clients.',
        'license_required' => 'An active license is required for this action.',
    ],
    'messages' => [
        'activated' => 'License activated successfully.',
        'trial_issued' => 'Trial license issued successfully.',
        'local_only' => 'Local license verification mode is active.',
        'grace_mode' => 'License authority is temporarily unavailable. Using the local grace period.',
    ],
];
