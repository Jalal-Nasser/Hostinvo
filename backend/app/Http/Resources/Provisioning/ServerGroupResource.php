<?php

namespace App\Http\Resources\Provisioning;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServerGroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'name' => $this->name,
            'selection_strategy' => $this->selection_strategy,
            'status' => $this->status,
            'notes' => $this->notes,
            'servers_count' => $this->whenCounted('servers'),
            'servers' => $this->whenLoaded('servers', fn () => $this->servers->map(fn ($server) => [
                'id' => $server->id,
                'name' => $server->name,
                'hostname' => $server->hostname,
                'panel_type' => $server->panel_type,
                'status' => $server->status,
                'packages_count' => $server->packages_count ?? null,
                'services_count' => $server->services_count ?? null,
            ])->values()),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
