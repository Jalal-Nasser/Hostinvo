<?php

namespace App\Http\Requests\Support;

use App\Models\Ticket;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        $ticket = $this->route('ticket');

        return $ticket instanceof Ticket && $this->user()->can('update', $ticket);
    }

    public function rules(): array
    {
        /** @var Ticket $ticket */
        $ticket = $this->route('ticket');
        $tenantId = $this->user()?->tenant_id ?? $ticket->tenant_id;

        return [
            'department_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('ticket_departments', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'status_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('ticket_statuses', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'client_id' => [
                'sometimes',
                'uuid',
                Rule::exists('clients', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'client_contact_id' => [
                'sometimes',
                'nullable',
                'uuid',
                Rule::exists('client_contacts', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'assigned_to_user_id' => [
                'sometimes',
                'nullable',
                'uuid',
                Rule::exists('users', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'subject' => ['sometimes', 'string', 'max:255'],
            'priority' => ['sometimes', Rule::in(Ticket::priorities())],
            'metadata' => ['sometimes', 'nullable', 'array'],
        ];
    }
}
