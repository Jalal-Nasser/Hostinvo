<?php

namespace App\Http\Resources\Billing;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'invoice_id' => $this->invoice_id,
            'client_id' => $this->client_id,
            'user_id' => $this->user_id,
            'type' => $this->type,
            'status' => $this->status,
            'payment_method' => $this->payment_method,
            'currency' => $this->currency,
            'amount_minor' => $this->amount_minor,
            'reference' => $this->reference,
            'paid_at' => optional($this->paid_at)?->toIso8601String(),
            'notes' => $this->notes,
            'metadata' => $this->metadata,
            'client' => $this->whenLoaded('client', fn () => [
                'id' => $this->client?->id,
                'display_name' => $this->client?->display_name,
                'email' => $this->client?->email,
            ]),
            'invoice' => $this->whenLoaded('invoice', fn () => [
                'id' => $this->invoice?->id,
                'reference_number' => $this->invoice?->reference_number,
                'status' => $this->invoice?->status,
            ]),
            'transactions' => TransactionResource::collection($this->whenLoaded('transactions')),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
