<?php

namespace App\Http\Requests\Billing\Concerns;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\ProductPricing;
use Illuminate\Validation\Rule;

trait HasInvoicePayloadRules
{
    /**
     * @return array<string, array<int, mixed>|string>
     */
    protected function invoicePayloadRules(): array
    {
        return [
            'client_id' => ['required', 'uuid'],
            'order_id' => ['nullable', 'uuid'],
            'currency' => ['nullable', 'string', 'size:3'],
            'issue_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:issue_date'],
            'status' => ['nullable', Rule::in(Invoice::statuses())],
            'recurring_cycle' => ['nullable', Rule::in(ProductPricing::billingCycles())],
            'next_invoice_date' => ['nullable', 'date'],
            'discount_type' => ['nullable', Rule::in(Invoice::discountTypes())],
            'discount_value' => [
                Rule::requiredIf(fn () => filled($this->input('discount_type'))),
                'nullable',
                'integer',
                'min:0',
            ],
            'credit_applied_minor' => ['nullable', 'integer', 'min:0'],
            'tax_rate_bps' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'notes' => ['nullable', 'string'],
            'metadata' => ['nullable', 'array'],
            'items' => [
                Rule::requiredIf(fn () => blank($this->input('order_id'))),
                'nullable',
                'array',
                'min:1',
            ],
            'items.*.id' => ['sometimes', 'integer'],
            'items.*.order_item_id' => ['nullable', 'integer'],
            'items.*.item_type' => ['required_with:items', Rule::in(InvoiceItem::types())],
            'items.*.description' => ['required_with:items', 'string', 'max:255'],
            'items.*.related_type' => ['nullable', 'string', 'max:64'],
            'items.*.related_id' => ['nullable', 'uuid'],
            'items.*.billing_cycle' => ['nullable', Rule::in(ProductPricing::billingCycles())],
            'items.*.billing_period_starts_at' => ['nullable', 'date'],
            'items.*.billing_period_ends_at' => ['nullable', 'date', 'after_or_equal:items.*.billing_period_starts_at'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.unit_price_minor' => ['required_with:items', 'integer', 'min:0'],
            'items.*.discount_amount_minor' => ['nullable', 'integer', 'min:0'],
            'items.*.tax_amount_minor' => ['nullable', 'integer', 'min:0'],
            'items.*.metadata' => ['nullable', 'array'],
        ];
    }
}
