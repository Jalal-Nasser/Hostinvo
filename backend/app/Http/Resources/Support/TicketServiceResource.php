<?php

namespace App\Http\Resources\Support;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $product = $this->resource->relationLoaded('product')
            ? $this->resource->getRelation('product')
            : null;

        return [
            'id' => $this->id,
            'reference_number' => $this->reference_number,
            'status' => $this->status,
            'domain' => $this->domain,
            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
            ] : null,
        ];
    }
}

