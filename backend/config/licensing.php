<?php

return [
    'plans' => [
        'free_trial' => [
            'label' => 'Free Trial',
            'max_clients' => 3,
            'max_services' => 1,
            'activation_limit' => 1,
            'duration_days' => 7,
            'is_trial' => true,
        ],
        'starter' => [
            'label' => 'Starter',
            'max_clients' => 35,
            'max_services' => 5,
            'activation_limit' => 1,
            'monthly_price' => 7,
        ],
        'growth' => [
            'label' => 'Growth',
            'max_clients' => 200,
            'max_services' => 10,
            'activation_limit' => 1,
            'monthly_price' => 19,
        ],
        'professional' => [
            'label' => 'Professional',
            'max_clients' => 500,
            'max_services' => 20,
            'activation_limit' => 2,
            'monthly_price' => 30,
        ],
    ],
    'verification' => [
        'authority_url' => env('LICENSING_VERIFICATION_URL'),
        'timeout_seconds' => (int) env('LICENSING_VERIFICATION_TIMEOUT', 5),
        'cache_minutes' => (int) env('LICENSING_VERIFICATION_CACHE_MINUTES', 15),
        'grace_period_hours' => (int) env('LICENSING_VERIFICATION_GRACE_HOURS', 72),
        'allow_local_validation_without_authority' => (bool) env('LICENSING_ALLOW_LOCAL_VALIDATION', true),
    ],
];
