<?php

namespace App\Http\Requests\Catalog;

use App\Models\ProductGroup;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductGroupRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', ProductGroup::class);
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
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'alpha_dash',
                Rule::unique('product_groups', 'slug')->where(
                    fn ($query) => $query->where('tenant_id', $tenantId)
                ),
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
