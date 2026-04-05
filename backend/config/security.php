<?php

return [
    'turnstile' => [
        'verify_url' => env('TURNSTILE_VERIFY_URL', 'https://challenges.cloudflare.com/turnstile/v0/siteverify'),
        'timeout_seconds' => (int) env('TURNSTILE_TIMEOUT_SECONDS', 5),
        'platform_defaults' => [
            'enabled' => false,
            'site_key' => '',
            'secret_key' => '',
            'forms' => [
                'login' => false,
                'provider_register' => false,
                'forgot_password' => false,
                'reset_password' => false,
                'verify_email_resend' => false,
            ],
        ],
        'tenant_defaults' => [
            'enabled' => false,
            'use_custom_keys' => false,
            'site_key' => '',
            'secret_key' => '',
            'forms' => [
                'client_login' => false,
                'portal_register' => false,
                'portal_forgot_password' => false,
                'portal_reset_password' => false,
                'portal_support' => false,
            ],
        ],
    ],
    'mfa' => [
        'issuer' => env('MFA_ISSUER', env('APP_NAME', 'Hostinvo')),
        'pending_session_key' => 'auth.mfa.pending',
        'setup_secret_session_key' => 'auth.mfa.setup_secret',
        'state_cookie' => env('AUTH_STATE_COOKIE', 'hostinvo_auth_state'),
        'pending_minutes' => (int) env('MFA_PENDING_MINUTES', 10),
        'time_step' => 30,
        'window' => 1,
        'recovery_codes_count' => 8,
    ],
];
