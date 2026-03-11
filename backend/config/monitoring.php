<?php

return [
    'metrics' => [
        'window_minutes' => (int) env('MONITORING_METRICS_WINDOW_MINUTES', 5),
        'retention_seconds' => (int) env('MONITORING_METRICS_RETENTION_SECONDS', 172800),
        'token' => env('MONITORING_METRICS_TOKEN'),
    ],

    'alerts' => [
        'queue_backlog_threshold' => (int) env('MONITORING_ALERT_QUEUE_BACKLOG_THRESHOLD', 500),
        'job_failure_rate_threshold' => (float) env('MONITORING_ALERT_JOB_FAILURE_RATE_THRESHOLD', 10),
        'log_channel' => env('MONITORING_ALERT_LOG_CHANNEL', env('LOG_CHANNEL', 'stack')),
        'webhook_url' => env('MONITORING_ALERT_WEBHOOK_URL'),
    ],
];
