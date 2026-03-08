<?php

namespace App\Http\Resources\Provisioning;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'server_group_id' => $this->server_group_id,
            'name' => $this->name,
            'hostname' => $this->hostname,
            'panel_type' => $this->panel_type,
            'api_endpoint' => $this->api_endpoint,
            'api_port' => $this->api_port,
            'status' => $this->status,
            'verify_ssl' => $this->verify_ssl,
            'max_accounts' => $this->max_accounts,
            'current_accounts' => $this->current_accounts,
            'username' => $this->username,
            'has_credentials' => filled($this->credentials),
            'last_tested_at' => optional($this->last_tested_at)?->toIso8601String(),
            'notes' => $this->notes,
            'packages_count' => $this->whenCounted('packages'),
            'services_count' => $this->whenCounted('services'),
            'group' => $this->whenLoaded('group', fn () => $this->group ? [
                'id' => $this->group->id,
                'name' => $this->group->name,
                'status' => $this->group->status,
            ] : null),
            'packages' => ServerPackageResource::collection($this->whenLoaded('packages')),
            'provisioning_jobs' => ProvisioningJobResource::collection($this->whenLoaded('provisioningJobs')),
            'provisioning_logs' => ProvisioningLogResource::collection($this->whenLoaded('provisioningLogs')),
            'services' => $this->whenLoaded('services', fn () => $this->services->map(fn ($service) => [
                'id' => $service->id,
                'reference_number' => $service->reference_number,
                'status' => $service->status,
                'provisioning_state' => $service->provisioning_state,
                'domain' => $service->domain,
            ])->values()),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
