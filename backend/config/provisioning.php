<?php

return [
    'queue' => [
        'name' => env('HOSTINVO_PROVISIONING_QUEUE', 'critical'),
        'backoff' => [60, 300, 900],
    ],

    'drivers' => [
        'cpanel' => \App\Provisioning\Drivers\Cpanel\CpanelDriver::class,
        'plesk' => \App\Provisioning\Drivers\Plesk\PleskDriver::class,
    ],
];
