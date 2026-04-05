<?php

namespace App\Http\Requests\Platform;

use App\Models\License;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlatformPlansRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return (bool) $user?->hasRole('super_admin');
    }

    public function rules(): array
    {
        return [
            'pricing_note' => ['nullable', 'string', 'max:255'],
            'plans' => ['required', 'array', 'min:1'],
            'plans.*.key' => ['required', 'string', Rule::in(License::plans())],
            'plans.*.label' => ['required', 'string', 'max:80'],
            'plans.*.marketing_name' => ['nullable', 'string', 'max:80'],
            'plans.*.description' => ['nullable', 'string', 'max:255'],
            'plans.*.features' => ['nullable', 'array', 'max:8'],
            'plans.*.features.*' => ['nullable', 'string', 'max:120'],
            'plans.*.monthly_price' => ['nullable', 'numeric', 'min:0'],
            'plans.*.max_clients' => ['required', 'integer', 'min:0'],
            'plans.*.max_services' => ['nullable', 'integer', 'min:0'],
            'plans.*.activation_limit' => ['nullable', 'integer', 'min:0'],
            'plans.*.duration_days' => ['nullable', 'integer', 'min:1'],
            'plans.*.is_trial' => ['nullable', 'boolean'],
        ];
    }
}
