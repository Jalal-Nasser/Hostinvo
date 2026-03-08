<?php

namespace App\Http\Requests\Domains;

use App\Models\Domain;
use App\Models\DomainContact;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PortalSyncDomainContactsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $domain = $this->route('domain');

        return $domain instanceof Domain && $this->user()->can('managePortalContacts', $domain);
    }

    public function rules(): array
    {
        return [
            'contacts' => ['required', 'array'],
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
