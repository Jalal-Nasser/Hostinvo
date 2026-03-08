<?php

namespace App\Http\Requests\Provisioning;

use App\Models\ServerGroup;
use Illuminate\Foundation\Http\FormRequest;

class IndexServerGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', ServerGroup::class);
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:32'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
