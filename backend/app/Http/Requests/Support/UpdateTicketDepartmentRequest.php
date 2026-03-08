<?php

namespace App\Http\Requests\Support;

use App\Models\TicketDepartment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTicketDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $ticketDepartment = $this->route('ticketDepartment');

        return $ticketDepartment instanceof TicketDepartment && $this->user()->can('update', $ticketDepartment);
    }

    public function rules(): array
    {
        /** @var TicketDepartment $ticketDepartment */
        $ticketDepartment = $this->route('ticketDepartment');
        $tenantId = $this->user()?->tenant_id ?? $ticketDepartment->tenant_id;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                Rule::unique('ticket_departments', 'slug')
                    ->ignore($ticketDepartment->getKey())
                    ->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'description' => ['sometimes', 'nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'display_order' => ['sometimes', 'integer', 'min:0', 'max:9999'],
        ];
    }
}
