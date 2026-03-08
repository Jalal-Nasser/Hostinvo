<?php

namespace App\Provisioning;

use App\Models\ProvisioningJob;
use App\Models\ProvisioningLog;
use App\Models\Service;

class ProvisioningLogger
{
    public function record(
        ProvisioningJob $job,
        string $status,
        string $message,
        array $requestPayload = [],
        array $responsePayload = []
    ): ProvisioningLog {
        return ProvisioningLog::query()->create([
            'tenant_id' => $job->tenant_id,
            'provisioning_job_id' => $job->id,
            'service_id' => $job->service_id,
            'server_id' => $job->server_id,
            'operation' => $job->operation,
            'status' => $status,
            'driver' => $job->driver,
            'message' => $message,
            'request_payload' => $requestPayload,
            'response_payload' => $responsePayload,
            'occurred_at' => now(),
        ]);
    }

    public function recordQueued(ProvisioningJob $job): ProvisioningLog
    {
        return $this->record(
            job: $job,
            status: ProvisioningLog::STATUS_QUEUED,
            message: "Provisioning job {$job->operation} has been queued.",
            requestPayload: $job->payload ?? [],
        );
    }

    public function recordServiceNote(Service $service, string $message, array $metadata = []): ProvisioningLog
    {
        return ProvisioningLog::query()->create([
            'tenant_id' => $service->tenant_id,
            'provisioning_job_id' => null,
            'service_id' => $service->id,
            'server_id' => $service->server_id,
            'operation' => $service->last_operation ?? 'service_note',
            'status' => ProvisioningLog::STATUS_PLACEHOLDER,
            'driver' => optional($service->server)->panel_type,
            'message' => $message,
            'request_payload' => [],
            'response_payload' => $metadata,
            'occurred_at' => now(),
        ]);
    }
}
