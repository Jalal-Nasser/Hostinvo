<?php

namespace App\Http\Requests\Billing;

use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;

class IndexPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', Payment::class);
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'invoice_id' => ['nullable', 'uuid'],
            'client_id' => ['nullable', 'uuid'],
            'type' => ['nullable', 'string', 'max:32'],
            'status' => ['nullable', 'string', 'max:32'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
