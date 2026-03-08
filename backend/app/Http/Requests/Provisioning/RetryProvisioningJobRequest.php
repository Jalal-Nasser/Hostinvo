<?php

namespace App\Http\Requests\Provisioning;

use Illuminate\Foundation\Http\FormRequest;

class RetryProvisioningJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('retry', $this->route('provisioningJob'));
    }

    public function rules(): array
    {
        return [];
    }
}
