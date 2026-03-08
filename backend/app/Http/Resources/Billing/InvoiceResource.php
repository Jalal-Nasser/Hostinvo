<?php

namespace App\Http\Resources\Billing;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'client_id' => $this->client_id,
            'order_id' => $this->order_id,
            'user_id' => $this->user_id,
            'reference_number' => $this->reference_number,
            'status' => $this->status,
            'currency' => $this->currency,
            'issue_date' => optional($this->issue_date)?->toDateString(),
            'due_date' => optional($this->due_date)?->toDateString(),
            'paid_at' => optional($this->paid_at)?->toIso8601String(),
            'cancelled_at' => optional($this->cancelled_at)?->toIso8601String(),
            'refunded_at' => optional($this->refunded_at)?->toIso8601String(),
            'recurring_cycle' => $this->recurring_cycle,
            'next_invoice_date' => optional($this->next_invoice_date)?->toDateString(),
            'discount_type' => $this->discount_type,
            'discount_value' => $this->discount_value,
            'discount_amount_minor' => $this->discount_amount_minor,
            'credit_applied_minor' => $this->credit_applied_minor,
            'tax_rate_bps' => $this->tax_rate_bps,
            'tax_amount_minor' => $this->tax_amount_minor,
            'subtotal_minor' => $this->subtotal_minor,
            'total_minor' => $this->total_minor,
            'amount_paid_minor' => $this->amount_paid_minor,
            'refunded_amount_minor' => $this->refunded_amount_minor,
            'balance_due_minor' => $this->balance_due_minor,
            'notes' => $this->notes,
            'metadata' => $this->metadata,
            'items_count' => $this->whenCounted('items'),
            'payments_count' => $this->whenCounted('payments'),
            'client' => $this->whenLoaded('client', fn () => [
                'id' => $this->client?->id,
                'display_name' => $this->client?->display_name,
                'email' => $this->client?->email,
                'currency' => $this->client?->currency,
                'preferred_locale' => $this->client?->preferred_locale,
            ]),
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
            'items' => InvoiceItemResource::collection($this->whenLoaded('items')),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'transactions' => TransactionResource::collection($this->whenLoaded('transactions')),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
