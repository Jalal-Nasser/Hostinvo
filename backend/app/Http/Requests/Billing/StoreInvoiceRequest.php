<?php

namespace App\Http\Requests\Billing;

use App\Http\Requests\Concerns\SanitizesInputContent;
use App\Http\Requests\Billing\Concerns\HasInvoicePayloadRules;
use App\Models\Invoice;
use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    use HasInvoicePayloadRules;
    use SanitizesInputContent;

    public function authorize(): bool
    {
        return $this->user()->can('create', Invoice::class);
    }

    protected function prepareForValidation(): void
    {
        $this->sanitizePlainTextFields(['notes']);
    }

    public function rules(): array
    {
        return $this->invoicePayloadRules();
    }
}
