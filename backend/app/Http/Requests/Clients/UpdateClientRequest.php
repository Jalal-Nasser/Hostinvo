<?php

namespace App\Http\Requests\Clients;

use App\Http\Requests\Concerns\SanitizesInputContent;
use App\Models\Client;
use App\Models\ClientAddress;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClientRequest extends FormRequest
{
    use SanitizesInputContent;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $client = $this->route('client');

        return $client instanceof Client && $this->user()->can('update', $client);
    }

    protected function prepareForValidation(): void
    {
        $this->sanitizePlainTextFields(['notes']);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Client $client */
        $client = $this->route('client');
        $tenantId = $this->user()?->tenant_id ?? $client->tenant_id;
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
                Rule::unique('clients', 'email')
                    ->ignore($client->getKey())
                    ->where(fn ($query) => $query->where('tenant_id', $tenantId)),
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
            'portal_access' => ['nullable', 'array'],
            'portal_access.enabled' => ['required_with:portal_access', 'boolean'],
            'portal_access.password' => [
                Rule::requiredIf(fn () => (bool) $this->boolean('portal_access.enabled') && blank($client->user_id)),
                'nullable',
                'string',
                'min:8',
            ],
            'portal_access.send_verification_email' => ['nullable', 'boolean'],
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
