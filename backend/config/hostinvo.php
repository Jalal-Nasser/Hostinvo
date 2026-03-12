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

    'performance' => [
        'pagination' => [
            'default_per_page' => (int) env('HOSTINVO_DEFAULT_PER_PAGE', 15),
            'max_per_page' => (int) env('HOSTINVO_MAX_PER_PAGE', 100),
        ],
        'cache' => [
            'tenant_settings_ttl_seconds' => (int) env('HOSTINVO_CACHE_TENANT_SETTINGS_TTL', 300),
            'catalog_selection_ttl_seconds' => (int) env('HOSTINVO_CACHE_CATALOG_SELECTION_TTL', 300),
        ],
    ],
];
