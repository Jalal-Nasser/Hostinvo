<?php

namespace App\Http\Requests\Catalog;

use App\Models\ConfigurableOption;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', Product::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $tenantId = $this->user()?->tenant_id;

        return [
            'product_group_id' => [
                'nullable',
                'integer',
                Rule::exists('product_groups', 'id')->where(
                    fn ($query) => $query->where('tenant_id', $tenantId)
                ),
            ],
            'type' => ['required', Rule::in([
                Product::TYPE_HOSTING,
            ])],
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'alpha_dash',
                Rule::unique('products', 'slug')->where(
                    fn ($query) => $query->where('tenant_id', $tenantId)
                ),
            ],
            'sku' => ['nullable', 'string', 'max:100'],
            'summary' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
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
