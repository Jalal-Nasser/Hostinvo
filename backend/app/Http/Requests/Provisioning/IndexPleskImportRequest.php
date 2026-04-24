<?php

namespace App\Http\Requests\Provisioning;

use Illuminate\Foundation\Http\FormRequest;

class IndexPleskImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('importExistingAccounts', $this->route('server'));
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
        ];
    }
}
