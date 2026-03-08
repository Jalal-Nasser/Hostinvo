<?php

namespace App\Http\Resources\Provisioning;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProvisioningLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'provisioning_job_id' => $this->provisioning_job_id,
            'service_id' => $this->service_id,
            'server_id' => $this->server_id,
            'operation' => $this->operation,
            'status' => $this->status,
            'driver' => $this->driver,
            'message' => $this->message,
            'request_payload' => $this->request_payload,
            'response_payload' => $this->response_payload,
            'occurred_at' => optional($this->occurred_at)?->toIso8601String(),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
