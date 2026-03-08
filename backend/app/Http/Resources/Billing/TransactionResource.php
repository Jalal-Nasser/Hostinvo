<?php

namespace App\Http\Resources\Billing;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payment_id' => $this->payment_id,
            'invoice_id' => $this->invoice_id,
            'client_id' => $this->client_id,
            'type' => $this->type,
            'status' => $this->status,
            'gateway' => $this->gateway,
            'external_reference' => $this->external_reference,
            'currency' => $this->currency,
            'amount_minor' => $this->amount_minor,
            'occurred_at' => optional($this->occurred_at)?->toIso8601String(),
            'request_payload' => $this->request_payload,
            'response_payload' => $this->response_payload,
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
