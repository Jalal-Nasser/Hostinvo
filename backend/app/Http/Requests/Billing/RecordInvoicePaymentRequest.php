<?php

namespace App\Http\Requests\Billing;

use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecordInvoicePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Payment::class);
    }

    public function rules(): array
    {
        return [
            'type' => ['nullable', Rule::in(Payment::types())],
            'status' => ['nullable', Rule::in(Payment::statuses())],
            'payment_method' => ['required', 'string', 'max:64'],
            'amount_minor' => ['required', 'integer', 'min:1'],
            'currency' => ['nullable', 'string', 'size:3'],
            'reference' => ['nullable', 'string', 'max:120'],
            'paid_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'metadata' => ['nullable', 'array'],
            'gateway' => ['nullable', 'string', 'max:64'],
            'external_reference' => ['nullable', 'string', 'max:120'],
            'request_payload' => ['nullable', 'array'],
            'response_payload' => ['nullable', 'array'],
        ];
    }
}
