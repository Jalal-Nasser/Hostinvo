<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\Concerns\ValidatesTurnstile;
use Illuminate\Foundation\Http\FormRequest;

class ResendEmailVerificationRequest extends FormRequest
{
    use ValidatesTurnstile;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email:rfc'],
            'locale' => ['nullable', 'string', 'max:10'],
            'turnstile_token' => ['nullable', 'string'],
        ];
    }

    protected function turnstileFormKey(): ?string
    {
        return 'verify_email_resend';
    }
}
