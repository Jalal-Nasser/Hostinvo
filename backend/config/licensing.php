<?php

return [
    'plans' => [
        'free_trial' => [
            'label' => 'Free Trial',
            'marketing_name' => '7 days',
            'description' => 'Evaluate Hostinvo on your own infrastructure before purchasing a paid license.',
            'features' => [
                'Up to 3 clients',
                'Trial license for testing',
                '7-day automatic expiry',
                'Self-hosted evaluation environment',
            ],
            'max_clients' => 3,
            'max_services' => 1,
            'activation_limit' => 1,
            'duration_days' => 7,
            'is_trial' => true,
        ],
        'starter' => [
            'label' => 'Starter',
            'marketing_name' => 'Starter',
            'description' => 'A compact self-hosted license for providers launching their first commercial environment.',
            'features' => [
                'Up to 35 clients',
                'Self-hosted license',
                'Billing and provisioning foundation',
                'English and Arabic support',
            ],
            'max_clients' => 35,
            'max_services' => 5,
            'activation_limit' => 1,
            'monthly_price' => 7,
        ],
        'growth' => [
            'label' => 'Growth',
            'marketing_name' => 'Growth',
            'description' => 'For providers scaling beyond the first wave of customers on their own infrastructure.',
            'features' => [
                'Up to 200 clients',
                'Self-hosted license',
                'Operational automation',
                'Ideal for growing teams',
            ],
            'max_clients' => 200,
            'max_services' => 10,
            'activation_limit' => 1,
            'monthly_price' => 19,
        ],
        'professional' => [
            'label' => 'Professional',
            'marketing_name' => 'Professional',
            'description' => 'A higher-capacity commercial license for serious provider operations.',
            'features' => [
                'Up to 500 clients',
                'Self-hosted license',
                'Advanced operational headroom',
                'Production-ready for larger deployments',
            ],
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
