<?php

namespace App\Http\Requests\Billing;

use App\Models\Invoice;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexPortalInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermissionTo('client.portal.access');
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(Invoice::statuses())],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
