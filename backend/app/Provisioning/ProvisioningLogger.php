<?php

namespace App\Provisioning;

use App\Models\ProvisioningJob;
use App\Models\ProvisioningLog;
use App\Models\Server;
use App\Models\Service;
use App\Provisioning\Support\SensitivePayloadSanitizer;

class ProvisioningLogger
{
    public function __construct(private readonly SensitivePayloadSanitizer $sanitizer)
    {
    }

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
            'request_payload' => $this->sanitizer->sanitizeArray($requestPayload),
            'response_payload' => $this->sanitizer->sanitizeArray($responsePayload),
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
            'response_payload' => $this->sanitizer->sanitizeArray($metadata),
            'occurred_at' => now(),
        ]);
    }

    public function recordServerEvent(
        Server $server,
        string $operation,
        string $status,
        string $message,
        array $requestPayload = [],
        array $responsePayload = []
    ): ProvisioningLog {
        return ProvisioningLog::query()->create([
            'tenant_id' => $server->tenant_id,
            'provisioning_job_id' => null,
            'service_id' => null,
            'server_id' => $server->id,
            'operation' => $operation,
            'status' => $status,
            'driver' => $server->panel_type,
            'message' => $message,
            'request_payload' => $this->sanitizer->sanitizeArray($requestPayload),
            'response_payload' => $this->sanitizer->sanitizeArray($responsePayload),
            'occurred_at' => now(),
        ]);
    }
}
