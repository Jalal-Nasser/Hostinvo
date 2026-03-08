<?php

namespace App\Http\Requests\Provisioning;

use App\Http\Requests\Provisioning\Concerns\HasServicePayloadRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateServiceRequest extends FormRequest
{
    use HasServicePayloadRules;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('service'));
    }

    public function rules(): array
    {
        return $this->servicePayloadRules();
    }
}
