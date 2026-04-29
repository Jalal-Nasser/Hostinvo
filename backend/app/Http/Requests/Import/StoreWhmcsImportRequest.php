<?php

namespace App\Http\Requests\Import;

use App\Models\Tenant;
use App\Models\TenantSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWhmcsImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', TenantSetting::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'host' => ['required', 'string', 'max:255'],
            'port' => ['required', 'integer', 'min:1', 'max:65535'],
            'database' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'max:2048'],
            'tenant_id' => [
                'nullable',
                'uuid',
                Rule::exists(Tenant::class, 'id'),
            ],
        ];
    }
}
