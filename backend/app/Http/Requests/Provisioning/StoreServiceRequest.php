<?php

namespace App\Http\Requests\Provisioning;

use App\Http\Requests\Provisioning\Concerns\HasServicePayloadRules;
use App\Models\Service;
use Illuminate\Foundation\Http\FormRequest;

class StoreServiceRequest extends FormRequest
{
    use HasServicePayloadRules;

    public function authorize(): bool
    {
        return $this->user()->can('create', Service::class);
    }

    public function rules(): array
    {
        return $this->servicePayloadRules();
    }
}
