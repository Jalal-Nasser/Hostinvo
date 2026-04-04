<?php

namespace App\Http\Requests\Provisioning;

use App\Models\Service;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexPortalServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermissionTo('client.portal.access');
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(Service::statuses())],
            'provisioning_state' => ['nullable', Rule::in(Service::provisioningStates())],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
