<?php

namespace App\Services\Monitoring;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;
use Throwable;

class MetricsService
{
    public function recordRequest(string $path, int $statusCode, float $latencyMs): void
    {
        try {
            $key = $this->requestMetricKey(now());

            Redis::connection()->hincrby($key, 'requests_total', 1);
            Redis::connection()->hincrbyfloat($key, 'latency_total_ms', round($latencyMs, 3));

            if ($statusCode >= 500) {
                Redis::connection()->hincrby($key, 'errors_total', 1);
            }

            Redis::connection()->expire($key, $this->retentionSeconds());
        } catch (Throwable) {
            // Metrics collection must never interrupt request processing.
        }
    }

    public function recordJobProcessed(?string $queueName): void
    {
        $this->recordJobMetric('jobs_processed_total', $queueName);
    }

    public function recordJobFailed(?string $queueName): void
    {
        $this->recordJobMetric('jobs_failed_total', $queueName);
    }

    public function snapshot(): array
    {
        $requestTotals = $this->aggregateRequestMetrics();
        $jobTotals = $this->aggregateJobMetrics();
        $queueDepth = $this->queueDepth();

        $requestCount = (int) $requestTotals['requests_total'];
        $errorCount = (int) $requestTotals['errors_total'];
        $latencyTotal = (float) $requestTotals['latency_total_ms'];
        $processedCount = (int) $jobTotals['jobs_processed_total'];
        $failedCount = (int) $jobTotals['jobs_failed_total'];

        $requestLatencyAverage = $requestCount > 0
            ? round($latencyTotal / $requestCount, 3)
            : 0.0;

        $errorRate = $requestCount > 0
            ? round($errorCount / $requestCount, 6)
            : 0.0;

        $jobTotal = $processedCount + $failedCount;
        $jobFailureRate = $jobTotal > 0
            ? round($failedCount / $jobTotal, 6)
            : 0.0;

        return [
            'timestamp' => now()->toIso8601String(),
            'window_minutes' => $this->windowMinutes(),
            'request_latency_ms_avg' => $requestLatencyAverage,
            'error_rate' => $errorRate,
            'error_rate_percent' => round($errorRate * 100, 3),
            'job_failure_rate' => $jobFailureRate,
            'job_failure_rate_percent' => round($jobFailureRate * 100, 3),
            'queue_depth' => [
                'total' => array_sum($queueDepth),
                'queues' => $queueDepth,
            ],
            'totals' => [
                'requests_total' => $requestCount,
                'errors_total' => $errorCount,
                'jobs_processed_total' => $processedCount,
                'jobs_failed_total' => $failedCount,
            ],
        ];
    }

    /**
     * @return array{requests_total:int, errors_total:int, latency_total_ms:float}
     */
    private function aggregateRequestMetrics(): array
    {
        $totals = [
            'requests_total' => 0,
            'errors_total' => 0,
            'latency_total_ms' => 0.0,
        ];

        try {
            foreach ($this->windowTimestamps() as $timestamp) {
                $fields = Redis::connection()->hgetall($this->requestMetricKey($timestamp));

                $totals['requests_total'] += (int) ($fields['requests_total'] ?? 0);
                $totals['errors_total'] += (int) ($fields['errors_total'] ?? 0);
                $totals['latency_total_ms'] += (float) ($fields['latency_total_ms'] ?? 0);
            }
        } catch (Throwable) {
            return $totals;
        }

        return $totals;
    }

    /**
     * @return array{jobs_processed_total:int, jobs_failed_total:int}
     */
    private function aggregateJobMetrics(): array
    {
        $totals = [
            'jobs_processed_total' => 0,
            'jobs_failed_total' => 0,
        ];

        try {
            foreach ($this->windowTimestamps() as $timestamp) {
                $fields = Redis::connection()->hgetall($this->jobMetricKey($timestamp));

                $totals['jobs_processed_total'] += (int) ($fields['jobs_processed_total'] ?? 0);
                $totals['jobs_failed_total'] += (int) ($fields['jobs_failed_total'] ?? 0);
            }
        } catch (Throwable) {
            return $totals;
        }

        return $totals;
    }

    /**
     * @return array<string,int>
     */
    private function queueDepth(): array
    {
        $depth = [];
        $queues = $this->queueNames();
        $connectionName = (string) config('queue.default', 'redis');

        try {
            $connection = Queue::connection($connectionName);

            foreach ($queues as $queueName) {
                $depth[$queueName] = method_exists($connection, 'size')
                    ? (int) $connection->size($queueName)
                    : 0;
            }
        } catch (Throwable) {
            foreach ($queues as $queueName) {
                $depth[$queueName] = 0;
            }
        }

        return $depth;
    }

    private function recordJobMetric(string $field, ?string $queueName): void
    {
        try {
            $key = $this->jobMetricKey(now());

            Redis::connection()->hincrby($key, $field, 1);

            if (is_string($queueName) && $queueName !== '') {
                Redis::connection()->hincrby($key, "queue_{$queueName}_{$field}", 1);
            }

            Redis::connection()->expire($key, $this->retentionSeconds());
        } catch (Throwable) {
            // Queue processing should not fail because metrics storage is unavailable.
        }
    }

    private function requestMetricKey(Carbon $timestamp): string
    {
        return 'monitoring:metrics:requests:'.$timestamp->format('YmdHi');
    }

    private function jobMetricKey(Carbon $timestamp): string
    {
        return 'monitoring:metrics:jobs:'.$timestamp->format('YmdHi');
    }

    /**
     * @return list<Carbon>
     */
    private function windowTimestamps(): array
    {
        $timestamps = [];
        $windowMinutes = $this->windowMinutes();

        for ($offset = 0; $offset < $windowMinutes; $offset++) {
            $timestamps[] = now()->subMinutes($offset);
        }

        return $timestamps;
    }

    /**
     * @return list<string>
     */
    private function queueNames(): array
    {
        $queueNames = [];

        foreach ((array) config('queue.tiers', []) as $tierConfig) {
            $queueName = $tierConfig['queue'] ?? null;

            if (! is_string($queueName) || $queueName === '') {
                continue;
            }

            $queueNames[$queueName] = $queueName;
        }

        if ($queueNames !== []) {
            return array_values($queueNames);
        }

        $defaultQueue = config('queue.connections.redis.queue', 'default');

        return [is_string($defaultQueue) && $defaultQueue !== '' ? $defaultQueue : 'default'];
    }

    private function windowMinutes(): int
    {
        return max(1, (int) config('monitoring.metrics.window_minutes', 5));
    }

    private function retentionSeconds(): int
    {
        return max(300, (int) config('monitoring.metrics.retention_seconds', 172800));
    }
}
