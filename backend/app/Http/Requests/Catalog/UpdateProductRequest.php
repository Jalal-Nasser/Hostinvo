<?php

namespace App\Http\Requests\Catalog;

use App\Models\ConfigurableOption;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
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
        /** @var Product $product */
        $product = $this->route('product');
        $tenantId = $this->user()?->tenant_id ?? $product->tenant_id;

        return [
            'product_group_id' => [
                'nullable',
                'integer',
                Rule::exists('product_groups', 'id')->where(
                    fn ($query) => $query->where('tenant_id', $tenantId)
                ),
            ],
            'server_id' => [
                'nullable',
                'integer',
                Rule::exists('servers', 'id')->where(
                    fn ($query) => $query->where('tenant_id', $tenantId)
                ),
            ],
            'type' => ['required', Rule::in([
                Product::TYPE_HOSTING,
            ])],
            'provisioning_module' => ['nullable', Rule::in(Product::provisioningModules())],
            'provisioning_package' => ['nullable', 'string', 'max:191'],
            'name' => ['required', 'string', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'alpha_dash',
                Rule::unique('products', 'slug')
                    ->ignore($product->getKey())
                    ->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'sku' => ['nullable', 'string', 'max:100'],
            'summary' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:32'],
            'welcome_email' => ['nullable', 'string', 'max:255'],
            'require_domain' => ['nullable', 'boolean'],
            'stock_control' => ['nullable', 'boolean'],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'apply_tax' => ['nullable', 'boolean'],
            'retired' => ['nullable', 'boolean'],
            'payment_type' => ['nullable', Rule::in(Product::paymentTypes())],
            'allow_multiple_quantities' => ['nullable', Rule::in(Product::quantityModes())],
            'recurring_cycles_limit' => ['nullable', 'integer', 'min:0'],
            'auto_terminate_days' => ['nullable', 'integer', 'min:0'],
            'termination_email' => ['nullable', 'string', 'max:191'],
            'prorata_billing' => ['nullable', 'boolean'],
            'prorata_date' => ['nullable', 'integer', 'between:1,31'],
            'charge_next_month' => ['nullable', 'integer', 'between:1,31'],
            'status' => ['required', Rule::in([
                Product::STATUS_DRAFT,
                Product::STATUS_ACTIVE,
                Product::STATUS_INACTIVE,
                Product::STATUS_ARCHIVED,
            ])],
            'visibility' => ['required', Rule::in([
                Product::VISIBILITY_PUBLIC,
                Product::VISIBILITY_PRIVATE,
                Product::VISIBILITY_HIDDEN,
            ])],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_featured' => ['nullable', 'boolean'],
            'configurable_options' => ['nullable', 'array'],
            'configurable_options.*.id' => ['nullable', 'integer'],
            'configurable_options.*.name' => ['required', 'string', 'max:255'],
            'configurable_options.*.code' => ['nullable', 'string', 'max:100', 'alpha_dash'],
            'configurable_options.*.option_type' => ['required', Rule::in(ConfigurableOption::types())],
            'configurable_options.*.description' => ['nullable', 'string'],
            'configurable_options.*.status' => ['required', Rule::in([
                ConfigurableOption::STATUS_ACTIVE,
                ConfigurableOption::STATUS_INACTIVE,
            ])],
            'configurable_options.*.is_required' => ['nullable', 'boolean'],
            'configurable_options.*.display_order' => ['nullable', 'integer', 'min:0'],
            'configurable_options.*.choices' => ['nullable', 'array'],
            'configurable_options.*.choices.*.id' => ['nullable', 'integer'],
            'configurable_options.*.choices.*.label' => ['required', 'string', 'max:255'],
            'configurable_options.*.choices.*.value' => ['nullable', 'string', 'max:100'],
            'configurable_options.*.choices.*.is_default' => ['nullable', 'boolean'],
            'configurable_options.*.choices.*.display_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
