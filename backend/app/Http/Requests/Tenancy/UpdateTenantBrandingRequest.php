<?php

namespace App\Http\Requests\Tenancy;

use App\Models\TenantSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTenantBrandingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', TenantSetting::class);
    }

    public function rules(): array
    {
        return [
            'company_name' => ['required', 'string', 'max:255'],
            'portal_name' => ['required', 'string', 'max:255'],
            'portal_tagline' => ['nullable', 'string', 'max:500'],
            'default_currency' => ['required', 'string', 'size:3'],
            'default_locale' => ['required', Rule::in((array) config('hostinvo.locales', ['en', 'ar']))],
            'timezone' => ['required', 'string', 'max:100'],
            'logo' => ['nullable', 'image', 'max:4096'],
            'favicon' => ['nullable', 'file', 'mimes:ico,png,svg,webp', 'max:2048'],
            'remove_logo' => ['nullable', 'boolean'],
            'remove_favicon' => ['nullable', 'boolean'],
        ];
    }
}
