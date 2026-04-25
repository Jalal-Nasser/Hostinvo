<?php

namespace App\Http\Resources\Provisioning;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'client_id' => $this->client_id,
            'product_id' => $this->product_id,
            'order_id' => $this->order_id,
            'order_item_id' => $this->order_item_id,
            'user_id' => $this->user_id,
            'server_id' => $this->server_id,
            'server_package_id' => $this->server_package_id,
            'reference_number' => $this->reference_number,
            'service_type' => $this->service_type,
            'status' => $this->status,
            'provisioning_state' => $this->provisioning_state,
            'billing_cycle' => $this->billing_cycle,
            'price' => $this->price,
            'currency' => $this->currency,
            'domain' => $this->domain,
            'username' => $this->username,
            'external_reference' => $this->external_reference,
            'external_id' => $this->external_id,
            'last_operation' => $this->last_operation,
            'registration_date' => optional($this->registration_date)?->toDateString(),
            'next_due_date' => optional($this->next_due_date)?->toDateString(),
            'termination_date' => optional($this->termination_date)?->toDateString(),
            'activated_at' => optional($this->activated_at)?->toIso8601String(),
            'suspended_at' => optional($this->suspended_at)?->toIso8601String(),
            'terminated_at' => optional($this->terminated_at)?->toIso8601String(),
            'last_synced_at' => optional($this->last_synced_at)?->toIso8601String(),
            'notes' => $this->notes,
            'metadata' => $this->metadata,
            'provisioning_jobs_count' => $this->whenCounted('provisioningJobs'),
            'client' => $this->whenLoaded('client', fn () => $this->client ? [
                'id' => $this->client->id,
                'display_name' => $this->client->display_name,
                'email' => $this->client->email,
            ] : null),
            'product' => $this->whenLoaded('product', fn () => $this->product ? [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'type' => $this->product->type,
            ] : null),
            'order' => $this->whenLoaded('order', fn () => $this->order ? [
                'id' => $this->order->id,
                'reference_number' => $this->order->reference_number,
                'status' => $this->order->status,
            ] : null),
            'owner' => $this->whenLoaded('owner', fn () => $this->owner ? [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
                'email' => $this->owner->email,
            ] : null),
            'server' => $this->whenLoaded('server', fn () => $this->server ? [
                'id' => $this->server->id,
                'name' => $this->server->name,
                'hostname' => $this->server->hostname,
                'panel_type' => $this->server->panel_type,
                'status' => $this->server->status,
            ] : null),
            'server_package' => $this->whenLoaded('serverPackage', fn () => $this->serverPackage ? [
                'id' => $this->serverPackage->id,
                'panel_package_name' => $this->serverPackage->panel_package_name,
                'display_name' => $this->serverPackage->display_name,
            ] : null),
            'credentials' => $this->whenLoaded('credentials', fn () => $this->credentials ? new ServiceCredentialResource($this->credentials) : null),
            'usage' => $this->whenLoaded('usage', fn () => $this->usage ? new ServiceUsageResource($this->usage) : null),
            'suspensions' => ServiceSuspensionResource::collection($this->whenLoaded('suspensions')),
            'provisioning_jobs' => ProvisioningJobResource::collection($this->whenLoaded('provisioningJobs')),
            'provisioning_logs' => ProvisioningLogResource::collection($this->whenLoaded('provisioningLogs')),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
