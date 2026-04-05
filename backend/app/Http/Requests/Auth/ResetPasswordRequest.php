<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\Concerns\ValidatesTurnstile;
use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    use ValidatesTurnstile;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'tenant_id' => ['nullable', 'uuid'],
            'tenant_signature' => ['nullable', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'turnstile_token' => ['nullable', 'string'],
        ];
    }

    protected function turnstileFormKey(): ?string
    {
        return 'reset_password';
    }
}
