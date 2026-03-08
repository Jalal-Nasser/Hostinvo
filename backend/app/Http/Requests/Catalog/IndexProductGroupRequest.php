<?php

namespace App\Http\Requests\Catalog;

use App\Models\ProductGroup;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexProductGroupRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', ProductGroup::class);
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
                ProductGroup::STATUS_ACTIVE,
                ProductGroup::STATUS_INACTIVE,
            ])],
            'visibility' => ['nullable', Rule::in([
                ProductGroup::VISIBILITY_PUBLIC,
                ProductGroup::VISIBILITY_PRIVATE,
                ProductGroup::VISIBILITY_HIDDEN,
            ])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
