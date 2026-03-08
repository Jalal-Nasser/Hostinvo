<?php

namespace App\Http\Resources\Orders;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'order_id' => $this->order_id,
            'product_id' => $this->product_id,
            'product_name' => $this->product_name,
            'product_type' => $this->product_type,
            'billing_cycle' => $this->billing_cycle,
            'quantity' => $this->quantity,
            'unit_price_minor' => $this->unit_price_minor,
            'setup_fee_minor' => $this->setup_fee_minor,
            'subtotal_minor' => $this->subtotal_minor,
            'total_minor' => $this->total_minor,
            'product_snapshot' => $this->product_snapshot,
            'configurable_options' => $this->configurable_options,
            'product' => $this->when($this->product, [
                'id' => $this->product?->id,
                'name' => $this->product?->name,
                'slug' => $this->product?->slug,
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
