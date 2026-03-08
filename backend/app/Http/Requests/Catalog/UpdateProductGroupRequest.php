<?php

namespace App\Http\Requests\Catalog;

use App\Models\ProductGroup;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductGroupRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $group = $this->route('product_group');

        return $group instanceof ProductGroup && $this->user()->can('update', $group);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var ProductGroup $group */
        $group = $this->route('product_group');
        $tenantId = $this->user()?->tenant_id ?? $group->tenant_id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'alpha_dash',
                Rule::unique('product_groups', 'slug')
                    ->ignore($group->getKey())
                    ->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in([
                ProductGroup::STATUS_ACTIVE,
                ProductGroup::STATUS_INACTIVE,
            ])],
            'visibility' => ['required', Rule::in([
                ProductGroup::VISIBILITY_PUBLIC,
                ProductGroup::VISIBILITY_PRIVATE,
                ProductGroup::VISIBILITY_HIDDEN,
            ])],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
