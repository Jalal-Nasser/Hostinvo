<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOnboardingCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermissionTo('tenant.manage') ?? false;
    }

    public function rules(): array
    {
        $tenant = $this->user()?->tenant;
        $tenantId = $tenant?->id;

        return [
            'company_name' => ['required', 'string', 'max:255'],
            'company_domain' => [
                'required',
                'string',
                'max:255',
                Rule::unique('tenants', 'primary_domain')->ignore($tenantId),
            ],
            'default_locale' => ['required', Rule::in((array) config('hostinvo.locales', ['en', 'ar']))],
            'default_currency' => ['required', 'string', 'size:3'],
            'timezone' => ['required', 'timezone'],
        ];
    }
}
