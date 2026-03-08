<?php

namespace App\Http\Resources\Provisioning;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProvisioningJobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'service_id' => $this->service_id,
            'server_id' => $this->server_id,
            'requested_by_user_id' => $this->requested_by_user_id,
            'operation' => $this->operation,
            'status' => $this->status,
            'driver' => $this->driver,
            'queue_name' => $this->queue_name,
            'attempts' => $this->attempts,
            'payload' => $this->payload,
            'result_payload' => $this->result_payload,
            'error_message' => $this->error_message,
            'requested_at' => optional($this->requested_at)?->toIso8601String(),
            'started_at' => optional($this->started_at)?->toIso8601String(),
            'completed_at' => optional($this->completed_at)?->toIso8601String(),
            'failed_at' => optional($this->failed_at)?->toIso8601String(),
            'service' => $this->whenLoaded('service', fn () => $this->service ? [
                'id' => $this->service->id,
                'reference_number' => $this->service->reference_number,
                'status' => $this->service->status,
                'provisioning_state' => $this->service->provisioning_state,
                'domain' => $this->service->domain,
            ] : null),
            'server' => $this->whenLoaded('server', fn () => $this->server ? [
                'id' => $this->server->id,
                'name' => $this->server->name,
                'hostname' => $this->server->hostname,
                'panel_type' => $this->server->panel_type,
            ] : null),
            'requested_by' => $this->whenLoaded('requestedBy', fn () => $this->requestedBy ? [
                'id' => $this->requestedBy->id,
                'name' => $this->requestedBy->name,
                'email' => $this->requestedBy->email,
            ] : null),
            'logs' => ProvisioningLogResource::collection($this->whenLoaded('logs')),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
