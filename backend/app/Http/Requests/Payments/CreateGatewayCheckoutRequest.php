<?php

namespace App\Http\Requests\Payments;

use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateGatewayCheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Payment::class);
    }

    public function rules(): array
    {
        return [
            'gateway' => ['required', Rule::in(array_keys(config('payments.gateways', [])))],
            'success_url' => ['required', 'url', 'max:2048'],
            'cancel_url' => ['required', 'url', 'max:2048'],
        ];
    }
}
