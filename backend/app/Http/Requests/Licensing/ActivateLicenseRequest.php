<?php

namespace App\Http\Requests\Licensing;

use Illuminate\Foundation\Http\FormRequest;

class ActivateLicenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'license_key' => ['required', 'string', 'max:120'],
            'domain' => ['required', 'string', 'max:255'],
            'instance_id' => ['required', 'string', 'max:191'],
        ];
    }
}
