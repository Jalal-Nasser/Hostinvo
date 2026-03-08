<?php

namespace App\Http\Requests\Provisioning;

use App\Http\Requests\Provisioning\Concerns\HasServerPayloadRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateServerRequest extends FormRequest
{
    use HasServerPayloadRules;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('server'));
    }

    public function rules(): array
    {
        return $this->serverPayloadRules();
    }
}
