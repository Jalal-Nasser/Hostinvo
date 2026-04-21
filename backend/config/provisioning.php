<?php

return [
    'queue' => [
        'name' => env('HOSTINVO_PROVISIONING_QUEUE', config('queue.tiers.critical.queue', 'critical')),
        'backoff' => config('queue.tiers.critical.backoff', [60, 300, 900]),
        'tries' => config('queue.tiers.critical.tries', 3),
    ],

    'cpanel' => [
        'default_port' => env('HOSTINVO_CPANEL_DEFAULT_PORT', 2087),
        'timeout' => env('HOSTINVO_CPANEL_TIMEOUT', 30),
        'connect_timeout' => env('HOSTINVO_CPANEL_CONNECT_TIMEOUT', 10),
        'retry_times' => env('HOSTINVO_CPANEL_RETRY_TIMES', 3),
        'retry_sleep_ms' => env('HOSTINVO_CPANEL_RETRY_SLEEP_MS', 500),
    ],

    'plesk' => [
        'default_port' => env('HOSTINVO_PLESK_DEFAULT_PORT', 8443),
        'timeout' => env('HOSTINVO_PLESK_TIMEOUT', 30),
        'connect_timeout' => env('HOSTINVO_PLESK_CONNECT_TIMEOUT', 10),
        'retry_times' => env('HOSTINVO_PLESK_RETRY_TIMES', 3),
        'retry_sleep_ms' => env('HOSTINVO_PLESK_RETRY_SLEEP_MS', 500),
    ],

    'drivers' => [
        'cpanel' => \App\Provisioning\Drivers\Cpanel\CpanelDriver::class,
        'plesk' => \App\Provisioning\Drivers\Plesk\PleskDriver::class,
        'directadmin' => \App\Provisioning\Drivers\Generic\GenericConnectionDriver::class,
        'custom' => \App\Provisioning\Drivers\Generic\GenericConnectionDriver::class,
    ],
];
