<?php

namespace App\Http\Requests\Clients;

use App\Models\Client;
use App\Models\ClientAddress;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClientRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', Client::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $tenantId = $this->user()?->tenant_id;
        $locales = config('hostinvo.locales', ['en', 'ar']);

        return [
            'user_id' => [
                'nullable',
                'uuid',
                Rule::exists('users', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'client_type' => ['required', Rule::in([Client::TYPE_COMPANY, Client::TYPE_INDIVIDUAL])],
            'first_name' => [
                Rule::requiredIf(fn () => $this->input('client_type') === Client::TYPE_INDIVIDUAL),
                'nullable',
                'string',
                'max:255',
            ],
            'last_name' => [
                Rule::requiredIf(fn () => $this->input('client_type') === Client::TYPE_INDIVIDUAL),
                'nullable',
                'string',
                'max:255',
            ],
            'company_name' => [
                Rule::requiredIf(fn () => $this->input('client_type') === Client::TYPE_COMPANY),
                'nullable',
                'string',
                'max:255',
            ],
            'email' => [
                'required',
                'email:rfc',
                'max:255',
                Rule::unique('clients', 'email')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'phone' => ['nullable', 'string', 'max:50'],
            'country' => ['required', 'string', 'size:2'],
            'status' => ['required', Rule::in([
                Client::STATUS_ACTIVE,
                Client::STATUS_INACTIVE,
                Client::STATUS_LEAD,
            ])],
            'preferred_locale' => ['required', Rule::in($locales)],
            'currency' => ['required', 'string', 'size:3'],
            'notes' => ['nullable', 'string'],
            'contacts' => ['nullable', 'array'],
            'contacts.*.id' => ['nullable', 'uuid'],
            'contacts.*.first_name' => ['required', 'string', 'max:255'],
            'contacts.*.last_name' => ['required', 'string', 'max:255'],
            'contacts.*.email' => ['required', 'email:rfc', 'max:255'],
            'contacts.*.phone' => ['nullable', 'string', 'max:50'],
            'contacts.*.job_title' => ['nullable', 'string', 'max:255'],
            'contacts.*.is_primary' => ['nullable', 'boolean'],
            'addresses' => ['nullable', 'array'],
            'addresses.*.id' => ['nullable', 'uuid'],
            'addresses.*.type' => ['required', Rule::in([
                ClientAddress::TYPE_BILLING,
                ClientAddress::TYPE_MAILING,
                ClientAddress::TYPE_SERVICE,
            ])],
            'addresses.*.line_1' => ['required', 'string', 'max:255'],
            'addresses.*.line_2' => ['nullable', 'string', 'max:255'],
            'addresses.*.city' => ['required', 'string', 'max:255'],
            'addresses.*.state' => ['nullable', 'string', 'max:255'],
            'addresses.*.postal_code' => ['nullable', 'string', 'max:50'],
            'addresses.*.country' => ['required', 'string', 'size:2'],
            'addresses.*.is_primary' => ['nullable', 'boolean'],
        ];
    }
}
