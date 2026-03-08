<?php

namespace App\Http\Resources\Provisioning;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceSuspensionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'service_id' => $this->service_id,
            'user_id' => $this->user_id,
            'reason' => $this->reason,
            'suspended_at' => optional($this->suspended_at)?->toIso8601String(),
            'unsuspended_at' => optional($this->unsuspended_at)?->toIso8601String(),
            'metadata' => $this->metadata,
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ] : null),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
