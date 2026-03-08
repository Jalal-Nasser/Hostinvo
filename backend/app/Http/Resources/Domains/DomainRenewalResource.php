<?php

namespace App\Http\Resources\Domains;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DomainRenewalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'domain_id' => $this->domain_id,
            'years' => $this->years,
            'price' => $this->price,
            'status' => $this->status,
            'renewed_at' => optional($this->renewed_at)?->toIso8601String(),
            'created_at' => optional($this->created_at)?->toIso8601String(),
        ];
    }
}
