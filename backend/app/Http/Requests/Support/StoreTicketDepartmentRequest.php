<?php

namespace App\Http\Requests\Support;

use App\Models\TicketDepartment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTicketDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', TicketDepartment::class);
    }

    public function rules(): array
    {
        $tenantId = $this->user()?->tenant_id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('ticket_departments', 'slug')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ];
    }
}
