<?php

namespace App\Http\Requests\Provisioning;

use Illuminate\Foundation\Http\FormRequest;

class TestServerConnectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('testConnection', $this->route('server'));
    }

    public function rules(): array
    {
        return [];
    }
}
