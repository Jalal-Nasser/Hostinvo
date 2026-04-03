<?php

$defaultOrigins = array_filter([
    env('MARKETING_URL'),
    env('PORTAL_URL'),
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]);

$allowedOrigins = array_values(array_unique(array_filter(array_map(
    static fn (string $origin): string => trim($origin),
    explode(',', env('CORS_ALLOWED_ORIGINS', implode(',', $defaultOrigins))),
))));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
