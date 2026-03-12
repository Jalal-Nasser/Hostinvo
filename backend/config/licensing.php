<?php

return [
    'plans' => [
        'starter' => [
            'label' => 'Starter',
            'max_clients' => 250,
            'max_services' => 5,
            'activation_limit' => 1,
        ],
        'professional' => [
            'label' => 'Professional',
            'max_clients' => 1000,
            'max_services' => 20,
            'activation_limit' => 3,
        ],
        'enterprise' => [
            'label' => 'Enterprise',
            'max_clients' => null,
            'max_services' => null,
            'activation_limit' => null,
        ],
    ],
];
