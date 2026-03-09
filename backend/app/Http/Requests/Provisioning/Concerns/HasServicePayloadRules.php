<?php

namespace App\Http\Requests\Provisioning\Concerns;

use App\Models\ProductPricing;
use App\Models\Service;
use Illuminate\Validation\Rule;

trait HasServicePayloadRules
{
    public function servicePayloadRules(): array
    {
        return [
            'client_id' => ['required', 'uuid'],
            'product_id' => ['required', 'uuid'],
            'order_id' => ['nullable', 'uuid'],
            'user_id' => ['nullable', 'uuid'],
            'server_id' => ['nullable', 'integer'],
            'server_package_id' => ['nullable', 'integer'],
            'reference_number' => ['nullable', 'string', 'max:64'],
            'service_type' => ['required', 'string', Rule::in([Service::TYPE_HOSTING])],
            'billing_cycle' => ['required', 'string', Rule::in(ProductPricing::billingCycles())],
            'domain' => ['nullable', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
