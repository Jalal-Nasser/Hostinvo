<?php

namespace App\Http\Requests\Security;

use App\Models\TenantSetting;
use App\Services\Tenancy\TenantMfaPolicyService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTenantMfaPolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', TenantSetting::class) ?? false;
    }

    public function rules(): array
    {
        $modes = [
            TenantMfaPolicyService::DISABLED,
            TenantMfaPolicyService::OPTIONAL,
            TenantMfaPolicyService::REQUIRED,
        ];

        return [
            'owner_admin' => ['required', 'string', Rule::in($modes)],
            'staff' => ['required', 'string', Rule::in($modes)],
            'clients' => ['required', 'string', Rule::in($modes)],
        ];
    }
}
