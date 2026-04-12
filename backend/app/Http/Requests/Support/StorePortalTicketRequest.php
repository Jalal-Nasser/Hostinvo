<?php

namespace App\Http\Requests\Support;

use App\Http\Requests\Concerns\SanitizesInputContent;
use App\Http\Requests\Concerns\ValidatesTurnstile;
use App\Models\Ticket;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePortalTicketRequest extends FormRequest
{
    use SanitizesInputContent;
    use ValidatesTurnstile;

    public function authorize(): bool
    {
        return $this->user()->can('create', Ticket::class);
    }

    protected function prepareForValidation(): void
    {
        $this->sanitizePlainTextFields(['subject', 'message']);
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
            'client_contact_id' => [
                'nullable',
                'uuid',
                Rule::exists('client_contacts', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'service_id' => [
                'nullable',
                'uuid',
                Rule::exists('services', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'subject' => ['required', 'string', 'max:255'],
            'priority' => ['required', Rule::in(Ticket::priorities())],
            'message' => ['required', 'string'],
            'metadata' => ['nullable', 'array'],
            'turnstile_token' => ['nullable', 'string'],
            'client_id' => ['prohibited'],
            'status_id' => ['prohibited'],
            'assigned_to_user_id' => ['prohibited'],
            'source' => ['prohibited'],
            'is_internal' => ['prohibited'],
        ];
    }

    protected function turnstileFormKey(): ?string
    {
        return 'portal_support';
    }
}
