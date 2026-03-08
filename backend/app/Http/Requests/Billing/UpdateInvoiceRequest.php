<?php

namespace App\Http\Requests\Billing;

use App\Http\Requests\Billing\Concerns\HasInvoicePayloadRules;
use App\Models\Invoice;
use Illuminate\Foundation\Http\FormRequest;

class UpdateInvoiceRequest extends FormRequest
{
    use HasInvoicePayloadRules;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('invoice') ?? Invoice::class);
    }

    public function rules(): array
    {
        return $this->invoicePayloadRules();
    }
}
