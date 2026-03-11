<?php

namespace App\Services\Monitoring;

use App\Services\System\HealthCheckService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class MonitoringAlertService
{
    public function __construct(
        private readonly HealthCheckService $healthChecks,
        private readonly MetricsService $metrics,
    ) {}

    /**
     * @return list<array{code:string, severity:string, message:string, context:array<string,mixed>}>
     */
    public function evaluate(): array
    {
        $alerts = [];
        $health = $this->healthChecks->overall();
        $snapshot = $this->metrics->snapshot();

        $databaseStatus = $health['checks']['database']['status'] ?? 'fail';
        if ($databaseStatus !== 'ok') {
            $alerts[] = [
                'code' => 'database_connectivity_failure',
                'severity' => 'critical',
                'message' => 'Database connectivity check failed.',
                'context' => [
                    'health' => $health['checks']['database'] ?? [],
                ],
            ];
        }

        $redisStatus = $health['checks']['redis']['status'] ?? 'fail';
        if ($redisStatus !== 'ok') {
            $alerts[] = [
                'code' => 'redis_connectivity_failure',
                'severity' => 'critical',
                'message' => 'Redis connectivity check failed.',
                'context' => [
                    'health' => $health['checks']['redis'] ?? [],
                ],
            ];
        }

        $queueBacklogThreshold = (int) config('monitoring.alerts.queue_backlog_threshold', 500);
        $queueDepthTotal = (int) ($snapshot['queue_depth']['total'] ?? 0);

        if ($queueDepthTotal >= $queueBacklogThreshold) {
            $alerts[] = [
                'code' => 'queue_backlog_threshold',
                'severity' => 'warning',
                'message' => 'Queue backlog threshold exceeded.',
                'context' => [
                    'queue_depth_total' => $queueDepthTotal,
                    'queue_depth_threshold' => $queueBacklogThreshold,
                    'queue_depth_by_queue' => $snapshot['queue_depth']['queues'] ?? [],
                ],
            ];
        }

        $jobFailureRatePercent = (float) ($snapshot['job_failure_rate_percent'] ?? ((float) ($snapshot['job_failure_rate'] ?? 0) * 100));
        $jobFailureRateThreshold = (float) config('monitoring.alerts.job_failure_rate_threshold', 10);

        if ($jobFailureRatePercent >= $jobFailureRateThreshold) {
            $alerts[] = [
                'code' => 'job_failure_rate_threshold',
                'severity' => 'warning',
                'message' => 'Job failure rate threshold exceeded.',
                'context' => [
                    'job_failure_rate_percent' => $jobFailureRatePercent,
                    'job_failure_rate_threshold_percent' => $jobFailureRateThreshold,
                    'jobs_processed_total' => (int) ($snapshot['totals']['jobs_processed_total'] ?? 0),
                    'jobs_failed_total' => (int) ($snapshot['totals']['jobs_failed_total'] ?? 0),
                ],
            ];
        }

        return $alerts;
    }

    /**
     * @return list<array{code:string, severity:string, message:string, context:array<string,mixed>}>
     */
    public function evaluateAndLog(): array
    {
        $alerts = $this->evaluate();

        if ($alerts === []) {
            return [];
        }

        $channel = (string) config('monitoring.alerts.log_channel', env('LOG_CHANNEL', 'stack'));

        foreach ($alerts as $alert) {
            Log::channel($channel)->critical('Monitoring alert triggered', $alert);
        }

        $this->dispatchWebhook($alerts);

        return $alerts;
    }

    /**
     * @param  list<array{code:string, severity:string, message:string, context:array<string,mixed>}>  $alerts
     */
    private function dispatchWebhook(array $alerts): void
    {
        $url = config('monitoring.alerts.webhook_url');

        if (! is_string($url) || $url === '') {
            return;
        }

        try {
            Http::timeout(5)->post($url, [
                'timestamp' => now()->toIso8601String(),
                'alerts' => $alerts,
            ])->throw();
        } catch (Throwable $exception) {
            $channel = (string) config('monitoring.alerts.log_channel', env('LOG_CHANNEL', 'stack'));

            Log::channel($channel)->error('Monitoring webhook dispatch failed.', [
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
