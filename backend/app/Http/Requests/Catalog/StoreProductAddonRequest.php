<?php

namespace App\Http\Requests\Catalog;

use App\Models\Product;
use App\Models\ProductAddon;
use App\Models\ProductPricing;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductAddonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', ProductAddon::class);
    }

    public function rules(): array
    {
        $tenantId = $this->user()?->tenant_id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in([
                ProductAddon::STATUS_ACTIVE,
                ProductAddon::STATUS_HIDDEN,
                ProductAddon::STATUS_ARCHIVED,
            ])],
            'visibility' => ['required', Rule::in([
                ProductAddon::VISIBILITY_VISIBLE,
                ProductAddon::VISIBILITY_HIDDEN,
            ])],
            'apply_tax' => ['nullable', 'boolean'],
            'auto_activate' => ['nullable', 'boolean'],
            'welcome_email' => ['nullable', 'string', 'max:255'],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => [
                'uuid',
                Rule::exists('products', 'id')->where(
                    fn ($query) => $query->where('tenant_id', $tenantId)
                ),
            ],
            'pricing' => ['required', 'array', 'min:1'],
            'pricing.*.billing_cycle' => ['required', Rule::in(ProductPricing::billingCycles())],
            'pricing.*.currency' => ['required', 'string', 'size:3'],
            'pricing.*.price' => ['required', 'numeric', 'min:0'],
            'pricing.*.setup_fee' => ['nullable', 'numeric', 'min:0'],
            'pricing.*.is_enabled' => ['nullable', 'boolean'],
        ];
    }
}
