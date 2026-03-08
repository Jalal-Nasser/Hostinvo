<?php

namespace App\Http\Requests\Provisioning;

use App\Models\ProvisioningJob;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DispatchProvisioningOperationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('dispatchProvisioning', $this->route('service'));
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'operation' => $this->route('operation'),
        ]);
    }

    public function rules(): array
    {
        return [
            'operation' => ['required', 'string', Rule::in(ProvisioningJob::operations())],
            'payload' => ['nullable', 'array'],
            'payload.password' => ['nullable', 'string', 'min:8', 'max:255'],
            'payload.disk_used_mb' => ['nullable', 'integer', 'min:0'],
            'payload.disk_limit_mb' => ['nullable', 'integer', 'min:0'],
            'payload.bandwidth_used_mb' => ['nullable', 'integer', 'min:0'],
            'payload.bandwidth_limit_mb' => ['nullable', 'integer', 'min:0'],
            'payload.email_accounts_used' => ['nullable', 'integer', 'min:0'],
            'payload.databases_used' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
