<?php

namespace App\Http\Requests\Catalog;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', Product::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in([
                Product::STATUS_DRAFT,
                Product::STATUS_ACTIVE,
                Product::STATUS_INACTIVE,
                Product::STATUS_ARCHIVED,
            ])],
            'visibility' => ['nullable', Rule::in([
                Product::VISIBILITY_PUBLIC,
                Product::VISIBILITY_PRIVATE,
                Product::VISIBILITY_HIDDEN,
            ])],
            'type' => ['nullable', Rule::in([
                Product::TYPE_HOSTING,
            ])],
            'product_group_id' => ['nullable', 'integer'],
            'server_id' => ['nullable', 'integer'],
            'provisioning_module' => ['nullable', Rule::in(Product::provisioningModules())],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
