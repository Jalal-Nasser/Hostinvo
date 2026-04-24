<?php

namespace App\Http\Requests\Provisioning;

use App\Models\ProductPricing;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ImportPleskSubscriptionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('importExistingAccounts', $this->route('server'));
    }

    public function rules(): array
    {
        return [
            'imports' => ['required', 'array', 'min:1'],
            'imports.*.subscription_name' => ['required', 'string', 'max:255'],
            'imports.*.product_id' => ['nullable', 'uuid'],
            'imports.*.client_id' => ['nullable', 'uuid'],
            'imports.*.billing_cycle' => ['nullable', 'string', Rule::in(ProductPricing::billingCycles())],
            'imports.*.notes' => ['nullable', 'string'],
            'imports.*.client' => ['nullable', 'array'],
            'imports.*.client.email' => ['nullable', 'email:rfc,dns'],
            'imports.*.client.company_name' => ['nullable', 'string', 'max:255'],
            'imports.*.client.first_name' => ['nullable', 'string', 'max:255'],
            'imports.*.client.last_name' => ['nullable', 'string', 'max:255'],
            'imports.*.client.phone' => ['nullable', 'string', 'max:255'],
            'imports.*.client.country' => ['nullable', 'string', 'size:2'],
        ];
    }
}
