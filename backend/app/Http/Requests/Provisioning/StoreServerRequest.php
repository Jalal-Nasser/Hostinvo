<?php

namespace App\Http\Requests\Provisioning;

use App\Http\Requests\Provisioning\Concerns\HasServerPayloadRules;
use App\Models\Server;
use Illuminate\Foundation\Http\FormRequest;

class StoreServerRequest extends FormRequest
{
    use HasServerPayloadRules;

    public function authorize(): bool
    {
        return $this->user()->can('create', Server::class);
    }

    public function rules(): array
    {
        return $this->serverPayloadRules();
    }
}
