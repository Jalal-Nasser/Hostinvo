<?php

namespace App\Http\Resources\Provisioning;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceUsageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'service_id' => $this->service_id,
            'disk_used_mb' => $this->disk_used_mb,
            'disk_limit_mb' => $this->disk_limit_mb,
            'bandwidth_used_mb' => $this->bandwidth_used_mb,
            'bandwidth_limit_mb' => $this->bandwidth_limit_mb,
            'email_accounts_used' => $this->email_accounts_used,
            'databases_used' => $this->databases_used,
            'last_synced_at' => optional($this->last_synced_at)?->toIso8601String(),
            'metadata' => $this->metadata,
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
