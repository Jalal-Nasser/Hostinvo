<?php

namespace App\Http\Requests\Catalog;

use App\Models\ProductAddon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexProductAddonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', ProductAddon::class);
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in([
                ProductAddon::STATUS_ACTIVE,
                ProductAddon::STATUS_HIDDEN,
                ProductAddon::STATUS_ARCHIVED,
            ])],
            'visibility' => ['nullable', Rule::in([
                ProductAddon::VISIBILITY_VISIBLE,
                ProductAddon::VISIBILITY_HIDDEN,
            ])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
