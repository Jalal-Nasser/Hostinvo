<?php

namespace App\Http\Requests\Tenancy;

use App\Models\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Tenant::class);
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'slug' => filled($this->input('slug')) ? (string) $this->input('slug') : null,
            'primary_domain' => filled($this->input('primary_domain'))
                ? strtolower(trim((string) $this->input('primary_domain')))
                : null,
            'owner_email' => strtolower(trim((string) $this->input('owner_email'))),
            'default_currency' => strtoupper((string) $this->input('default_currency', 'USD')),
        ]);
    }

    public function rules(): array
    {
        $locales = config('hostinvo.locales', ['en', 'ar']);

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash', Rule::unique('tenants', 'slug')],
            'status' => ['nullable', Rule::in(['active', 'suspended'])],
            'primary_domain' => ['required', 'string', 'max:255', Rule::unique('tenants', 'primary_domain')],
            'default_locale' => ['required', Rule::in($locales)],
            'default_currency' => ['required', 'string', 'size:3'],
            'timezone' => ['required', 'string', 'max:255'],
            'owner_name' => ['required', 'string', 'max:255'],
            'owner_email' => ['required', 'email:rfc', 'max:255'],
            'owner_password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }
}
