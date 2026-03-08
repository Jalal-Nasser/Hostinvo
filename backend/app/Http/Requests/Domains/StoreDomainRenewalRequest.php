<?php

namespace App\Http\Requests\Domains;

use App\Models\Domain;
use App\Models\DomainRenewal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDomainRenewalRequest extends FormRequest
{
    public function authorize(): bool
    {
        $domain = $this->route('domain');

        return $domain instanceof Domain && $this->user()->can('update', $domain);
    }

    public function rules(): array
    {
        return [
            'years' => ['required', 'integer', 'min:1', 'max:10'],
            'price' => ['required', 'integer', 'min:0'],
            'status' => ['required', Rule::in(DomainRenewal::statuses())],
            'renewed_at' => ['nullable', 'date'],
        ];
    }
}
