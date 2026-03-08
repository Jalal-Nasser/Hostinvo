<?php

namespace App\Http\Requests\Orders\Concerns;

use App\Models\Order;
use App\Models\ProductPricing;
use Illuminate\Validation\Rule;

trait HasOrderPayloadRules
{
    protected function orderPayloadRules(bool $allowStatus = false): array
    {
        $tenantId = $this->user()?->tenant_id;

        $rules = [
            'client_id' => [
                'required',
                'uuid',
                Rule::exists('clients', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'currency' => ['nullable', 'string', 'size:3'],
            'coupon_code' => ['nullable', 'string', 'max:100'],
            'discount_type' => ['nullable', Rule::in(Order::discountTypes())],
            'discount_value' => [
                Rule::requiredIf(fn () => filled($this->input('discount_type'))),
                'nullable',
                'integer',
                'min:0',
            ],
            'tax_rate_bps' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['nullable', 'integer'],
            'items.*.product_id' => [
                'required',
                'uuid',
                Rule::exists('products', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'items.*.billing_cycle' => ['required', Rule::in(ProductPricing::billingCycles())],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:1000'],
            'items.*.configurable_options' => ['nullable', 'array'],
            'items.*.configurable_options.*.configurable_option_id' => [
                'required',
                'integer',
                Rule::exists('configurable_options', 'id')->where(
                    fn ($query) => $query->where('tenant_id', $tenantId)
                ),
            ],
            'items.*.configurable_options.*.selected_value' => ['present'],
        ];

        if ($allowStatus) {
            $rules['status'] = ['nullable', Rule::in(Order::statuses())];
        }

        return $rules;
    }
}
