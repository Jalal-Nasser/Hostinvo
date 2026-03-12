<?php

namespace App\Http\Resources\Orders;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'client_id' => $this->client_id,
            'user_id' => $this->user_id,
            'reference_number' => $this->reference_number,
            'status' => $this->status,
            'currency' => $this->currency,
            'coupon_code' => $this->coupon_code,
            'discount_type' => $this->discount_type,
            'discount_value' => $this->discount_value,
            'discount_amount_minor' => $this->discount_amount_minor,
            'tax_rate_bps' => $this->tax_rate_bps,
            'tax_amount_minor' => $this->tax_amount_minor,
            'subtotal_minor' => $this->subtotal_minor,
            'total_minor' => $this->total_minor,
            'notes' => $this->notes,
            'placed_at' => $this->placed_at,
            'accepted_at' => $this->accepted_at,
            'completed_at' => $this->completed_at,
            'cancelled_at' => $this->cancelled_at,
            'items_count' => $this->whenCounted('items'),
            'client' => $this->whenLoaded('client', fn () => $this->client ? [
                'id' => $this->client->id,
                'display_name' => $this->client->display_name,
                'email' => $this->client->email,
                'currency' => $this->client->currency,
                'preferred_locale' => $this->client->preferred_locale,
            ] : null),
            'owner' => $this->whenLoaded('owner', fn () => $this->owner ? [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
                'email' => $this->owner->email,
            ] : null),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
