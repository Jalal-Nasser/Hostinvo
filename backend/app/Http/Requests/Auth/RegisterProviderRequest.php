<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\Concerns\ValidatesTurnstile;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterProviderRequest extends FormRequest
{
    use ValidatesTurnstile;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email:rfc',
                'max:255',
                Rule::unique('users', 'email')->whereNull('deleted_at'),
            ],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'company_name' => ['required', 'string', 'max:255'],
            'company_domain' => ['nullable', 'string', 'max:255'],
            'default_locale' => ['nullable', Rule::in((array) config('hostinvo.locales', ['en', 'ar']))],
            'default_currency' => ['nullable', 'string', 'size:3'],
            'timezone' => ['nullable', 'timezone'],
            'license_key' => ['nullable', 'string', 'max:120'],
            'license_domain' => ['required_with:license_key', 'string', 'max:255'],
            'license_instance_id' => ['required_with:license_key', 'string', 'max:191'],
            'turnstile_token' => ['nullable', 'string'],
        ];
    }

    protected function turnstileFormKey(): ?string
    {
        return 'provider_register';
    }
}
