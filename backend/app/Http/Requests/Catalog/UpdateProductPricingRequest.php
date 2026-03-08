<?php

namespace App\Http\Requests\Catalog;

use App\Models\Product;
use App\Models\ProductPricing;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductPricingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $product = $this->route('product');

        return $product instanceof Product && $this->user()->can('update', $product);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'pricing' => ['required', 'array', 'min:1'],
            'pricing.*.billing_cycle' => ['required', Rule::in(ProductPricing::billingCycles())],
            'pricing.*.currency' => ['required', 'string', 'size:3'],
            'pricing.*.price' => ['required', 'numeric', 'min:0'],
            'pricing.*.setup_fee' => ['nullable', 'numeric', 'min:0'],
            'pricing.*.is_enabled' => ['nullable', 'boolean'],
        ];
    }
}
