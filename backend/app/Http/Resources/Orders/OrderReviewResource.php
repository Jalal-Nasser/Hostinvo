<?php

namespace App\Http\Resources\Orders;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderReviewResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'reference_number' => data_get($this->resource, 'reference_number'),
            'status' => data_get($this->resource, 'status'),
            'currency' => data_get($this->resource, 'currency'),
            'coupon_code' => data_get($this->resource, 'coupon_code'),
            'discount_type' => data_get($this->resource, 'discount_type'),
            'discount_value' => data_get($this->resource, 'discount_value'),
            'discount_amount_minor' => data_get($this->resource, 'discount_amount_minor'),
            'tax_rate_bps' => data_get($this->resource, 'tax_rate_bps'),
            'tax_amount_minor' => data_get($this->resource, 'tax_amount_minor'),
            'subtotal_minor' => data_get($this->resource, 'subtotal_minor'),
            'total_minor' => data_get($this->resource, 'total_minor'),
            'notes' => data_get($this->resource, 'notes'),
            'client' => data_get($this->resource, 'client'),
            'items' => OrderReviewItemResource::collection(data_get($this->resource, 'items', [])),
        ];
    }
}
