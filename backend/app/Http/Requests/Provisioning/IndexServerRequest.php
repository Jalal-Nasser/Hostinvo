<?php

namespace App\Http\Requests\Provisioning;

use App\Models\Server;
use Illuminate\Foundation\Http\FormRequest;

class IndexServerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', Server::class);
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:32'],
            'panel_type' => ['nullable', 'string', 'max:32'],
            'server_group_id' => ['nullable', 'integer'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
