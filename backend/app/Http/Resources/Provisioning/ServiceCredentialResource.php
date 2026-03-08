<?php

namespace App\Http\Resources\Provisioning;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceCredentialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'service_id' => $this->service_id,
            'has_credentials' => filled($this->credentials),
            'control_panel_url' => $this->control_panel_url,
            'access_url' => $this->access_url,
            'metadata' => $this->metadata,
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
