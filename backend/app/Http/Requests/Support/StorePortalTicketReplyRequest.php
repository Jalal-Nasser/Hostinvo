<?php

namespace App\Http\Requests\Support;

use App\Http\Requests\Concerns\SanitizesInputContent;
use App\Models\Ticket;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePortalTicketReplyRequest extends FormRequest
{
    use SanitizesInputContent;

    public function authorize(): bool
    {
        $ticket = $this->route('ticket');

        return $ticket instanceof Ticket && $this->user()->can('reply', $ticket);
    }

    protected function prepareForValidation(): void
    {
        $this->sanitizePlainTextFields(['message']);
    }

    public function rules(): array
    {
        /** @var Ticket $ticket */
        $ticket = $this->route('ticket');
        $tenantId = $this->user()?->tenant_id ?? $ticket->tenant_id;

        return [
            'client_contact_id' => [
                'nullable',
                'uuid',
                Rule::exists('client_contacts', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'message' => ['required', 'string'],
            'metadata' => ['nullable', 'array'],
            'assigned_to_user_id' => ['prohibited'],
            'status_id' => ['prohibited'],
            'is_internal' => ['prohibited'],
        ];
    }
}

