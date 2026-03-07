<?php

return [
    'locales' => explode(',', env('HOSTINVO_SUPPORTED_LOCALES', 'en,ar')),

    'default_currency' => env('HOSTINVO_DEFAULT_CURRENCY', 'USD'),

    'panel_drivers' => explode(',', env('HOSTINVO_PANEL_DRIVERS', 'cpanel,plesk')),

    'api' => [
        'prefix' => 'api/v1',
        'admin_prefix' => 'admin',
        'client_prefix' => 'client',
    ],
];
