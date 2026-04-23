<?php

namespace App\Http\Resources\Clients;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Billing\InvoiceResource;
use App\Http\Resources\Provisioning\ServiceResource;

class ClientResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'user_id' => $this->user_id,
            'client_type' => $this->client_type,
            'display_name' => $this->display_name,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'company_name' => $this->company_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'country' => $this->country,
            'status' => $this->status,
            'preferred_locale' => $this->preferred_locale,
            'currency' => $this->currency,
            'notes' => $this->notes,
            'contacts_count' => $this->whenCounted('contacts'),
            'addresses_count' => $this->whenCounted('addresses'),
            'services_count' => $this->whenCounted('services'),
            'invoices_count' => $this->whenCounted('invoices'),
            'owner' => $this->whenLoaded('owner', fn () => $this->owner ? [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
                'email' => $this->owner->email,
                'email_verified_at' => $this->owner->email_verified_at,
            ] : null),
            'contacts' => ClientContactResource::collection($this->whenLoaded('contacts')),
            'addresses' => ClientAddressResource::collection($this->whenLoaded('addresses')),
            'activity_logs' => ClientActivityLogResource::collection($this->whenLoaded('activityLogs')),
            'services' => ServiceResource::collection($this->whenLoaded('services')),
            'invoices' => InvoiceResource::collection($this->whenLoaded('invoices')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
