<?php

namespace App\Http\Requests\Provisioning;

use App\Models\ServerGroup;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreServerGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', ServerGroup::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'selection_strategy' => ['required', 'string', Rule::in(ServerGroup::strategies())],
            'status' => ['required', 'string', Rule::in(ServerGroup::statuses())],
            'notes' => ['nullable', 'string'],
        ];
    }
}
