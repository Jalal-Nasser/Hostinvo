<?php

namespace App\Http\Controllers;

use App\Services\Monitoring\MetricsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class MetricsController extends Controller
{
    public function __construct(
        private readonly MetricsService $metrics,
    ) {}

    public function json(): JsonResponse
    {
        return $this->success($this->metrics->snapshot());
    }

    public function prometheus(): Response
    {
        $snapshot = $this->metrics->snapshot();
        $queueDepth = (array) ($snapshot['queue_depth']['queues'] ?? []);
        $queueProcessed = (array) ($snapshot['queues']['processed_total'] ?? []);
        $queueFailed = (array) ($snapshot['queues']['failed_total'] ?? []);
        $lines = [
            '# HELP hostinvo_request_latency_ms_avg Average HTTP request latency in milliseconds.',
            '# TYPE hostinvo_request_latency_ms_avg gauge',
            sprintf('hostinvo_request_latency_ms_avg %.3F', (float) ($snapshot['request_latency_ms_avg'] ?? 0)),

            '# HELP hostinvo_error_rate HTTP error rate between 0 and 1.',
            '# TYPE hostinvo_error_rate gauge',
            sprintf('hostinvo_error_rate %.6F', (float) ($snapshot['error_rate'] ?? 0)),

            '# HELP hostinvo_job_failure_rate Queue job failure rate between 0 and 1.',
            '# TYPE hostinvo_job_failure_rate gauge',
            sprintf('hostinvo_job_failure_rate %.6F', (float) ($snapshot['job_failure_rate'] ?? 0)),

            '# HELP hostinvo_queue_depth Queue backlog depth per queue.',
            '# TYPE hostinvo_queue_depth gauge',
        ];

        foreach ($queueDepth as $queueName => $depth) {
            $escapedQueue = str_replace(['\\', '"'], ['\\\\', '\"'], (string) $queueName);
            $lines[] = sprintf('hostinvo_queue_depth{queue="%s"} %d', $escapedQueue, (int) $depth);
        }

        $lines[] = '# HELP hostinvo_queue_depth_total Total queue backlog depth.';
        $lines[] = '# TYPE hostinvo_queue_depth_total gauge';
        $lines[] = sprintf('hostinvo_queue_depth_total %d', (int) ($snapshot['queue_depth']['total'] ?? 0));

        $lines[] = '# HELP hostinvo_job_failures_total Total failed jobs in metric window.';
        $lines[] = '# TYPE hostinvo_job_failures_total gauge';
        $lines[] = sprintf('hostinvo_job_failures_total %d', (int) ($snapshot['totals']['jobs_failed_total'] ?? 0));

        $lines[] = '# HELP hostinvo_queue_jobs_processed_total Total processed jobs per queue in metric window.';
        $lines[] = '# TYPE hostinvo_queue_jobs_processed_total gauge';
        foreach ($queueProcessed as $queueName => $count) {
            $escapedQueue = str_replace(['\\', '"'], ['\\\\', '\"'], (string) $queueName);
            $lines[] = sprintf('hostinvo_queue_jobs_processed_total{queue="%s"} %d', $escapedQueue, (int) $count);
        }

        $lines[] = '# HELP hostinvo_queue_jobs_failed_total Total failed jobs per queue in metric window.';
        $lines[] = '# TYPE hostinvo_queue_jobs_failed_total gauge';
        foreach ($queueFailed as $queueName => $count) {
            $escapedQueue = str_replace(['\\', '"'], ['\\\\', '\"'], (string) $queueName);
            $lines[] = sprintf('hostinvo_queue_jobs_failed_total{queue="%s"} %d', $escapedQueue, (int) $count);
        }

        return response(implode("\n", $lines)."\n", 200, [
            'Content-Type' => 'text/plain; version=0.0.4; charset=utf-8',
        ]);
    }
}
