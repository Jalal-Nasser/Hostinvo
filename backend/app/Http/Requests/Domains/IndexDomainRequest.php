<?php

namespace App\Http\Requests\Domains;

use App\Models\Domain;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexDomainRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', Domain::class);
    }

    public function rules(): array
    {
        $tenantId = $this->user()?->tenant_id;

        return [
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(Domain::statuses())],
            'client_id' => [
                'nullable',
                'uuid',
                Rule::exists('clients', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'registrar' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
