<?php

namespace App\Http\Resources\Billing;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'order_item_id' => $this->order_item_id,
            'item_type' => $this->item_type,
            'description' => $this->description,
            'related_type' => $this->related_type,
            'related_id' => $this->related_id,
            'billing_cycle' => $this->billing_cycle,
            'billing_period_starts_at' => optional($this->billing_period_starts_at)?->toDateString(),
            'billing_period_ends_at' => optional($this->billing_period_ends_at)?->toDateString(),
            'quantity' => $this->quantity,
            'unit_price_minor' => $this->unit_price_minor,
            'subtotal_minor' => $this->subtotal_minor,
            'discount_amount_minor' => $this->discount_amount_minor,
            'tax_amount_minor' => $this->tax_amount_minor,
            'total_minor' => $this->total_minor,
            'metadata' => $this->metadata,
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
