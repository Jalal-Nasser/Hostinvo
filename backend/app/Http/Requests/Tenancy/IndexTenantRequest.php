<?php

namespace App\Http\Requests\Tenancy;

use App\Models\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', Tenant::class);
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['active', 'suspended', 'inactive', 'archived'])],
            'plan' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
