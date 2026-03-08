<?php

namespace App\Http\Resources\Orders;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderReviewItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'product_id' => data_get($this->resource, 'product_id'),
            'product_name' => data_get($this->resource, 'product_name'),
            'product_type' => data_get($this->resource, 'product_type'),
            'billing_cycle' => data_get($this->resource, 'billing_cycle'),
            'quantity' => data_get($this->resource, 'quantity'),
            'unit_price_minor' => data_get($this->resource, 'unit_price_minor'),
            'setup_fee_minor' => data_get($this->resource, 'setup_fee_minor'),
            'subtotal_minor' => data_get($this->resource, 'subtotal_minor'),
            'total_minor' => data_get($this->resource, 'total_minor'),
            'product_snapshot' => data_get($this->resource, 'product_snapshot'),
            'configurable_options' => data_get($this->resource, 'configurable_options', []),
        ];
    }
}
