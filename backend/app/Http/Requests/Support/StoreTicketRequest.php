<?php

namespace App\Http\Requests\Support;

use App\Models\Ticket;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Ticket::class);
    }

    public function rules(): array
    {
        $tenantId = $this->user()?->tenant_id;

        return [
            'department_id' => [
                'nullable',
                'integer',
                Rule::exists('ticket_departments', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'status_id' => [
                'nullable',
                'integer',
                Rule::exists('ticket_statuses', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'client_id' => [
                'required',
                'uuid',
                Rule::exists('clients', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'client_contact_id' => [
                'nullable',
                'uuid',
                Rule::exists('client_contacts', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'assigned_to_user_id' => [
                'nullable',
                'uuid',
                Rule::exists('users', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'subject' => ['required', 'string', 'max:255'],
            'priority' => ['required', Rule::in(Ticket::priorities())],
            'source' => ['nullable', Rule::in(Ticket::sources())],
            'message' => ['required', 'string'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
