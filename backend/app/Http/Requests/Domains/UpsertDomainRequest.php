<?php

namespace App\Http\Requests\Domains;

use App\Models\Domain;
use App\Models\DomainContact;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertDomainRequest extends FormRequest
{
    public function authorize(): bool
    {
        $domain = $this->route('domain');

        if ($domain instanceof Domain) {
            return $this->user()->can('update', $domain);
        }

        return $this->user()->can('create', Domain::class);
    }

    public function rules(): array
    {
        /** @var Domain|null $domain */
        $domain = $this->route('domain');
        $tenantId = $this->user()?->tenant_id ?? $domain?->tenant_id;

        return [
            'client_id' => [
                'required',
                'uuid',
                Rule::exists('clients', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'service_id' => [
                'nullable',
                'uuid',
                Rule::exists('services', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'domain' => [
                'required',
                'string',
                'max:255',
                Rule::unique('domains', 'domain')
                    ->ignore($domain?->getKey())
                    ->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'tld' => ['required', 'string', 'max:50'],
            'status' => ['required', Rule::in(Domain::statuses())],
            'registrar' => ['nullable', 'string', 'max:100'],
            'registration_date' => ['nullable', 'date'],
            'expiry_date' => ['required', 'date'],
            'auto_renew' => ['required', 'boolean'],
            'dns_management' => ['required', 'boolean'],
            'id_protection' => ['required', 'boolean'],
            'renewal_price' => ['nullable', 'integer', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'notes' => ['nullable', 'string'],
            'metadata' => ['nullable', 'array'],
            'contacts' => ['nullable', 'array'],
            'contacts.*.id' => ['nullable', 'integer'],
            'contacts.*.type' => ['required', Rule::in(DomainContact::types())],
            'contacts.*.first_name' => ['required', 'string', 'max:100'],
            'contacts.*.last_name' => ['required', 'string', 'max:100'],
            'contacts.*.email' => ['required', 'email:rfc', 'max:255'],
            'contacts.*.phone' => ['nullable', 'string', 'max:50'],
            'contacts.*.address' => ['required', 'array'],
            'contacts.*.address.line1' => ['required', 'string', 'max:255'],
            'contacts.*.address.city' => ['required', 'string', 'max:255'],
            'contacts.*.address.state' => ['nullable', 'string', 'max:255'],
            'contacts.*.address.postal_code' => ['nullable', 'string', 'max:50'],
            'contacts.*.address.country' => ['required', 'string', 'size:2'],
        ];
    }
}
