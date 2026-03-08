<?php

namespace App\Http\Requests\Provisioning;

use App\Models\ProvisioningJob;
use Illuminate\Foundation\Http\FormRequest;

class IndexProvisioningJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', ProvisioningJob::class);
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:32'],
            'operation' => ['nullable', 'string', 'max:64'],
            'service_id' => ['nullable', 'uuid'],
            'server_id' => ['nullable', 'uuid'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
