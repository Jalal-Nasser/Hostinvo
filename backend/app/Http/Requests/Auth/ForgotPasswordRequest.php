<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\Concerns\ValidatesTurnstile;
use Illuminate\Foundation\Http\FormRequest;

class ForgotPasswordRequest extends FormRequest
{
    use ValidatesTurnstile;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'turnstile_token' => ['nullable', 'string'],
        ];
    }

    protected function turnstileFormKey(): ?string
    {
        return 'forgot_password';
    }
}
