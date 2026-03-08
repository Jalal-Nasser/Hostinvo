<?php

namespace App\Http\Requests\Payments;

use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;

class CapturePayPalCheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Payment::class);
    }

    public function rules(): array
    {
        return [
            'order_id' => ['required', 'string', 'max:191'],
            'payer_id' => ['nullable', 'string', 'max:191'],
        ];
    }
}
