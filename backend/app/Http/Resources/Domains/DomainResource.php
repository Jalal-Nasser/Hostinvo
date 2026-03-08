<?php

namespace App\Http\Resources\Domains;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DomainResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'client_id' => $this->client_id,
            'service_id' => $this->service_id,
            'domain' => $this->domain,
            'tld' => $this->tld,
            'status' => $this->status,
            'registrar' => $this->registrar,
            'registration_date' => optional($this->registration_date)?->toDateString(),
            'expiry_date' => optional($this->expiry_date)?->toDateString(),
            'auto_renew' => $this->auto_renew,
            'dns_management' => $this->dns_management,
            'id_protection' => $this->id_protection,
            'renewal_price' => $this->renewal_price,
            'currency' => $this->currency,
            'notes' => $this->notes,
            'metadata' => $this->metadata,
            'contacts_count' => $this->whenCounted('contacts'),
            'renewals_count' => $this->whenCounted('renewals'),
            'client' => $this->whenLoaded('client', fn () => $this->client ? [
                'id' => $this->client->id,
                'display_name' => $this->client->display_name,
                'email' => $this->client->email,
                'preferred_locale' => $this->client->preferred_locale,
            ] : null),
            'service' => $this->whenLoaded('service', fn () => $this->service ? [
                'id' => $this->service->id,
                'reference_number' => $this->service->reference_number,
                'status' => $this->service->status,
                'domain' => $this->service->domain,
            ] : null),
            'contacts' => DomainContactResource::collection($this->whenLoaded('contacts')),
            'renewals' => DomainRenewalResource::collection($this->whenLoaded('renewals')),
            'registrar_logs' => RegistrarLogResource::collection($this->whenLoaded('registrarLogs')),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
            'deleted_at' => optional($this->deleted_at)?->toIso8601String(),
        ];
    }
}
