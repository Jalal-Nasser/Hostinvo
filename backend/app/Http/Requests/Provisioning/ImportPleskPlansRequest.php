<?php

namespace App\Http\Requests\Provisioning;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ImportPleskPlansRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('importPlans', $this->route('server'));
    }

    public function rules(): array
    {
        $tenantId = $this->user()?->tenant_id;

        return [
            'imports' => ['required', 'array', 'min:1'],
            'imports.*.plan_name' => ['required', 'string', 'max:255'],
            'imports.*.product_name' => ['nullable', 'string', 'max:255'],
            'imports.*.product_group_id' => [
                'nullable',
                'integer',
                Rule::exists('product_groups', 'id')->where(
                    fn ($query) => $query->where('tenant_id', $tenantId)
                ),
            ],
        ];
    }
}
