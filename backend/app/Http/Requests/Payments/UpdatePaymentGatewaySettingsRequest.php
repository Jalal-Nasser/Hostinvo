<?php

namespace App\Http\Requests\Payments;

use App\Models\TenantSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePaymentGatewaySettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', TenantSetting::class);
    }

    public function rules(): array
    {
        return [
            'stripe' => ['required', 'array'],
            'stripe.enabled' => ['required', 'boolean'],
            'stripe.publishable_key' => ['nullable', 'string', 'max:255'],
            'stripe.secret_key' => ['nullable', 'string', 'max:255'],
            'stripe.webhook_secret' => ['nullable', 'string', 'max:255'],
            'paypal' => ['required', 'array'],
            'paypal.enabled' => ['required', 'boolean'],
            'paypal.client_id' => ['nullable', 'string', 'max:255'],
            'paypal.client_secret' => ['nullable', 'string', 'max:255'],
            'paypal.webhook_id' => ['nullable', 'string', 'max:255'],
            'paypal.mode' => ['required', Rule::in(['sandbox', 'live'])],
            'offline' => ['required', 'array'],
            'offline.enabled' => ['required', 'boolean'],
            'offline.instructions' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
