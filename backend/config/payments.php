<?php

return [
    'webhook_tolerance_seconds' => (int) env('PAYMENT_WEBHOOK_TOLERANCE_SECONDS', 300),

    'gateways' => [
        'stripe' => [
            'driver' => \App\Payments\Drivers\Stripe\StripeGateway::class,
            'label' => 'Stripe',
            'description' => 'Card payments via Stripe Checkout.',
            'enabled' => env('PAYMENTS_STRIPE_ENABLED', false),
            'required' => ['publishable_key', 'secret_key', 'webhook_secret'],
            'settings' => [
                'enabled' => 'payments.stripe.enabled',
                'publishable_key' => 'payments.stripe.publishable_key',
                'secret_key' => 'payments.stripe.secret_key',
                'webhook_secret' => 'payments.stripe.webhook_secret',
            ],
            'publishable_key' => env('STRIPE_PUBLISHABLE_KEY'),
            'secret_key' => env('STRIPE_SECRET_KEY'),
            'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
            'base_url' => env('STRIPE_BASE_URL', 'https://api.stripe.com'),
        ],
        'paypal' => [
            'driver' => \App\Payments\Drivers\PayPal\PayPalGateway::class,
            'label' => 'PayPal',
            'description' => 'PayPal hosted checkout with order capture.',
            'enabled' => env('PAYMENTS_PAYPAL_ENABLED', false),
            'required' => ['client_id', 'client_secret', 'webhook_id'],
            'settings' => [
                'enabled' => 'payments.paypal.enabled',
                'client_id' => 'payments.paypal.client_id',
                'client_secret' => 'payments.paypal.client_secret',
                'webhook_id' => 'payments.paypal.webhook_id',
                'mode' => 'payments.paypal.mode',
            ],
            'client_id' => env('PAYPAL_CLIENT_ID'),
            'client_secret' => env('PAYPAL_CLIENT_SECRET'),
            'webhook_id' => env('PAYPAL_WEBHOOK_ID'),
            'mode' => env('PAYPAL_MODE', 'sandbox'),
            'base_urls' => [
                'sandbox' => env('PAYPAL_SANDBOX_BASE_URL', 'https://api-m.sandbox.paypal.com'),
                'live' => env('PAYPAL_LIVE_BASE_URL', 'https://api-m.paypal.com'),
            ],
        ],
    ],
];
