<?php

namespace App\Http\Requests\Tenancy;

use App\Models\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        $tenant = $this->route('tenant');

        return $tenant instanceof Tenant && $this->user()->can('update', $tenant);
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'slug' => filled($this->input('slug')) ? (string) $this->input('slug') : null,
            'primary_domain' => filled($this->input('primary_domain'))
                ? strtolower(trim((string) $this->input('primary_domain')))
                : null,
            'owner_email' => filled($this->input('owner_email'))
                ? strtolower(trim((string) $this->input('owner_email')))
                : null,
            'default_currency' => strtoupper((string) $this->input('default_currency', 'USD')),
        ]);
    }

    public function rules(): array
    {
        /** @var Tenant $tenant */
        $tenant = $this->route('tenant');
        $locales = config('hostinvo.locales', ['en', 'ar']);
        $ownerId = $tenant->owner_user_id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'alpha_dash',
                Rule::unique('tenants', 'slug')->ignore($tenant->getKey()),
            ],
            'status' => ['nullable', Rule::in(['active', 'suspended'])],
            'primary_domain' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('tenants', 'primary_domain')->ignore($tenant->getKey()),
            ],
            'default_locale' => ['required', Rule::in($locales)],
            'default_currency' => ['required', 'string', 'size:3'],
            'timezone' => ['required', 'string', 'max:255'],
            'owner_name' => ['required', 'string', 'max:255'],
            'owner_email' => [
                'required',
                'email:rfc',
                'max:255',
                Rule::unique('users', 'email')
                    ->ignore($ownerId)
                    ->where(fn ($query) => $query->where('tenant_id', $tenant->id)),
            ],
            'owner_password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ];
    }
}
