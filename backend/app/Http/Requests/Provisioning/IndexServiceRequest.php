<?php

namespace App\Http\Requests\Provisioning;

use App\Models\Service;
use Illuminate\Foundation\Http\FormRequest;

class IndexServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', Service::class);
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:32'],
            'provisioning_state' => ['nullable', 'string', 'max:32'],
            'client_id' => ['nullable', 'uuid'],
            'product_id' => ['nullable', 'uuid'],
            'server_id' => ['nullable', 'integer'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
