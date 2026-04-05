<?php

namespace App\Services\Billing;

use App\Contracts\Repositories\Billing\InvoiceRepositoryInterface;
use App\Contracts\Repositories\Clients\ClientRepositoryInterface;
use App\Contracts\Repositories\Orders\OrderRepositoryInterface;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Notifications\NotificationDispatchService;
use App\Services\Notifications\NotificationEventCatalog;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class InvoiceService
{
    public function __construct(
        private readonly InvoiceRepositoryInterface $invoices,
        private readonly ClientRepositoryInterface $clients,
        private readonly OrderRepositoryInterface $orders,
        private readonly NotificationDispatchService $notifications,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->invoices->paginate($filters);
    }

    public function paginateForPortal(User $user, array $filters): LengthAwarePaginator
    {
        return $this->invoices->paginateForPortal($user, $filters);
    }

    public function getForDisplay(Invoice $invoice): Invoice
    {
        return $this->invoices->findByIdForDisplay($invoice->getKey()) ?? $invoice;
    }

    public function getForPortalDisplay(User $user, Invoice $invoice): ?Invoice
    {
        return $this->invoices->findByIdForPortalDisplay($user, $invoice->getKey());
    }

    public function create(array $payload, User $actor): Invoice
    {
        return DB::transaction(function () use ($payload, $actor): Invoice {
            $summary = $this->buildInvoiceSummary($payload, $actor);

            $invoice = $this->invoices->create($this->extractInvoiceAttributes($summary));
            $this->invoices->syncItems($invoice, $summary['items']);
            $resolvedInvoice = $this->getForDisplay($invoice);
            $this->dispatchInvoiceCreatedNotification($resolvedInvoice);

            return $resolvedInvoice;
        });
    }

    public function update(Invoice $invoice, array $payload, User $actor): Invoice
    {
        return DB::transaction(function () use ($invoice, $payload, $actor): Invoice {
            $summary = $this->buildInvoiceSummary($payload, $actor, $invoice);

            $this->invoices->update($invoice, $this->extractInvoiceAttributes($summary));
            $this->invoices->syncItems($invoice, $summary['items']);

            return $this->getForDisplay($invoice);
        });
    }

    public function delete(Invoice $invoice): void
    {
        if (! in_array($invoice->status, [Invoice::STATUS_DRAFT, Invoice::STATUS_CANCELLED], true)) {
            throw ValidationException::withMessages([
                'invoice' => ['Only draft or cancelled invoices can be archived.'],
            ]);
        }

        if ($invoice->payments()->exists()) {
            throw ValidationException::withMessages([
                'invoice' => ['Invoices with payment history cannot be archived.'],
            ]);
        }

        $this->invoices->delete($invoice);
    }

    private function buildInvoiceSummary(array $payload, User $actor, ?Invoice $invoice = null): array
    {
        $tenantId = $invoice?->tenant_id ?? $actor->tenant_id;

        if (blank($tenantId)) {
            throw ValidationException::withMessages([
                'tenant' => ['Tenant context is required for billing management.'],
            ]);
        }

        $client = $this->clients->findById($payload['client_id']);

        if (! $client || $client->tenant_id !== $tenantId) {
            throw ValidationException::withMessages([
                'client_id' => ['The selected client is invalid for the current tenant.'],
            ]);
        }

        $order = null;

        if (filled($payload['order_id'] ?? null)) {
            $order = $this->orders->findByIdForDisplay((string) $payload['order_id']);

            if (! $order || $order->tenant_id !== $tenantId) {
                throw ValidationException::withMessages([
                    'order_id' => ['The selected order is invalid for the current tenant.'],
                ]);
            }

            if ($order->client_id !== $client->id) {
                throw ValidationException::withMessages([
                    'order_id' => ['The selected order does not belong to the selected client.'],
                ]);
            }
        }

        $itemsPayload = collect($payload['items'] ?? [])->values();
        $items = $itemsPayload->isEmpty() && $order
            ? $this->buildItemsFromOrder($order)
            : $itemsPayload->map(fn (array $item) => $this->buildInvoiceItem($item, $tenantId, $order))->all();

        if ($items === []) {
            throw ValidationException::withMessages([
                'items' => ['At least one invoice item is required.'],
            ]);
        }

        $subtotalMinor = (int) collect($items)->sum('subtotal_minor');
        $lineDiscountMinor = (int) collect($items)->sum('discount_amount_minor');
        $lineTaxMinor = (int) collect($items)->sum('tax_amount_minor');
        $discountType = filled($payload['discount_type'] ?? null)
            ? (string) $payload['discount_type']
            : null;
        $discountValue = (int) ($payload['discount_value'] ?? 0);
        $invoiceLevelDiscountMinor = $this->resolveDiscountAmount(
            max($subtotalMinor - $lineDiscountMinor, 0),
            $discountType,
            $discountValue
        );
        $discountAmountMinor = $lineDiscountMinor + $invoiceLevelDiscountMinor;
        $creditAppliedMinor = min(
            max((int) ($payload['credit_applied_minor'] ?? ($invoice?->credit_applied_minor ?? 0)), 0),
            max($subtotalMinor - $discountAmountMinor, 0)
        );
        $taxRateBps = (int) ($payload['tax_rate_bps'] ?? ($invoice?->tax_rate_bps ?? 0));
        $taxableBaseMinor = max($subtotalMinor - $discountAmountMinor - $creditAppliedMinor, 0);
        $invoiceLevelTaxMinor = intdiv($taxableBaseMinor * $taxRateBps, 10000);
        $taxAmountMinor = $lineTaxMinor + $invoiceLevelTaxMinor;
        $totalMinor = $taxableBaseMinor + $taxAmountMinor;

        if ($invoice && $invoice->payments()->exists() && $totalMinor < $invoice->amount_paid_minor) {
            throw ValidationException::withMessages([
                'total' => ['The invoice total cannot be reduced below the amount already paid.'],
            ]);
        }

        $requestedStatus = (string) ($payload['status'] ?? $invoice?->status ?? Invoice::STATUS_UNPAID);
        $issueDate = (string) ($payload['issue_date'] ?? optional($invoice?->issue_date)?->toDateString() ?? now()->toDateString());
        $dueDate = $payload['due_date'] ?? optional($invoice?->due_date)?->toDateString() ?? $issueDate;

        $amountPaidMinor = $invoice?->amount_paid_minor ?? 0;
        $refundedAmountMinor = $invoice?->refunded_amount_minor ?? 0;

        if ($requestedStatus === Invoice::STATUS_PAID) {
            $amountPaidMinor = max($amountPaidMinor, $totalMinor);
        }

        if ($requestedStatus === Invoice::STATUS_REFUNDED) {
            $amountPaidMinor = max($amountPaidMinor, $totalMinor);
            $refundedAmountMinor = max($refundedAmountMinor, $amountPaidMinor);
        }

        $status = $this->resolveStatus(
            $requestedStatus,
            $dueDate,
            $totalMinor,
            $amountPaidMinor,
            $refundedAmountMinor
        );
        $timestamps = $this->resolveStatusTimestamps(
            $status,
            $invoice,
            $amountPaidMinor,
            $refundedAmountMinor
        );

        return [
            'tenant_id' => $tenantId,
            'client_id' => $client->id,
            'order_id' => $order?->id,
            'user_id' => $invoice?->user_id ?? $actor->id,
            'reference_number' => $invoice?->reference_number ?? $this->generateReferenceNumber(),
            'status' => $status,
            'currency' => Str::upper((string) ($payload['currency'] ?? $client->currency ?? config('hostinvo.default_currency', 'USD'))),
            'issue_date' => $issueDate,
            'due_date' => $dueDate,
            'paid_at' => $timestamps['paid_at'],
            'cancelled_at' => $timestamps['cancelled_at'],
            'refunded_at' => $timestamps['refunded_at'],
            'recurring_cycle' => $payload['recurring_cycle'] ?? $invoice?->recurring_cycle,
            'next_invoice_date' => $payload['next_invoice_date'] ?? optional($invoice?->next_invoice_date)?->toDateString(),
            'discount_type' => $discountType,
            'discount_value' => $discountValue,
            'discount_amount_minor' => $discountAmountMinor,
            'credit_applied_minor' => $creditAppliedMinor,
            'tax_rate_bps' => $taxRateBps,
            'tax_amount_minor' => $taxAmountMinor,
            'subtotal_minor' => $subtotalMinor,
            'total_minor' => $totalMinor,
            'amount_paid_minor' => $amountPaidMinor,
            'refunded_amount_minor' => $refundedAmountMinor,
            'balance_due_minor' => max($totalMinor - $amountPaidMinor, 0),
            'notes' => $payload['notes'] ?? null,
            'metadata' => $payload['metadata'] ?? null,
            'items' => $items,
        ];
    }

    private function buildItemsFromOrder(Order $order): array
    {
        return collect($order->items ?? [])
            ->map(fn (OrderItem $item) => [
                'order_item_id' => $item->id,
                'item_type' => InvoiceItem::TYPE_ORDER,
                'description' => sprintf('%s (%s)', $item->product_name, $item->billing_cycle),
                'related_type' => 'order_item',
                'related_id' => $item->id,
                'billing_cycle' => $item->billing_cycle,
                'billing_period_starts_at' => null,
                'billing_period_ends_at' => null,
                'quantity' => $item->quantity,
                'unit_price_minor' => intdiv($item->total_minor, max($item->quantity, 1)),
                'subtotal_minor' => $item->total_minor,
                'discount_amount_minor' => 0,
                'tax_amount_minor' => 0,
                'total_minor' => $item->total_minor,
                'metadata' => [
                    'product_snapshot' => $item->product_snapshot,
                    'configurable_options' => $item->configurable_options,
                ],
            ])
            ->all();
    }

    private function buildInvoiceItem(array $payload, string $tenantId, ?Order $order = null): array
    {
        $orderItem = null;

        if (filled($payload['order_item_id'] ?? null)) {
            $orderItem = OrderItem::query()->find($payload['order_item_id']);

            if (! $orderItem || $orderItem->tenant_id !== $tenantId) {
                throw ValidationException::withMessages([
                    'items' => ['One or more linked order items are invalid for the current tenant.'],
                ]);
            }

            if ($order && $orderItem->order_id !== $order->id) {
                throw ValidationException::withMessages([
                    'items' => ['The selected order item does not belong to the selected order.'],
                ]);
            }
        }

        $quantity = max(1, (int) ($payload['quantity'] ?? $orderItem?->quantity ?? 1));
        $unitPriceMinor = max(
            0,
            (int) ($payload['unit_price_minor'] ?? (
                $orderItem ? intdiv($orderItem->total_minor, max($orderItem->quantity, 1)) : 0
            ))
        );
        $subtotalMinor = $unitPriceMinor * $quantity;
        $lineDiscountMinor = max(0, (int) ($payload['discount_amount_minor'] ?? 0));
        $lineTaxMinor = max(0, (int) ($payload['tax_amount_minor'] ?? 0));
        $totalMinor = max($subtotalMinor - $lineDiscountMinor, 0) + $lineTaxMinor;

        return [
            'id' => $payload['id'] ?? null,
            'order_item_id' => $orderItem?->id,
            'item_type' => $payload['item_type'] ?? ($orderItem ? InvoiceItem::TYPE_ORDER : InvoiceItem::TYPE_MANUAL),
            'description' => $payload['description'] ?? ($orderItem
                ? sprintf('%s (%s)', $orderItem->product_name, $orderItem->billing_cycle)
                : 'Invoice item'),
            'related_type' => $payload['related_type'] ?? ($orderItem ? 'order_item' : null),
            'related_id' => $payload['related_id'] ?? $orderItem?->id,
            'billing_cycle' => $payload['billing_cycle'] ?? $orderItem?->billing_cycle,
            'billing_period_starts_at' => $payload['billing_period_starts_at'] ?? null,
            'billing_period_ends_at' => $payload['billing_period_ends_at'] ?? null,
            'quantity' => $quantity,
            'unit_price_minor' => $unitPriceMinor,
            'subtotal_minor' => $subtotalMinor,
            'discount_amount_minor' => $lineDiscountMinor,
            'tax_amount_minor' => $lineTaxMinor,
            'total_minor' => $totalMinor,
            'metadata' => $payload['metadata'] ?? ($orderItem ? [
                'product_snapshot' => $orderItem->product_snapshot,
                'configurable_options' => $orderItem->configurable_options,
            ] : null),
        ];
    }

    private function resolveDiscountAmount(int $subtotalMinor, ?string $discountType, int $discountValue): int
    {
        if ($discountType === null || $discountValue <= 0) {
            return 0;
        }

        if ($discountType === Invoice::DISCOUNT_FIXED) {
            return min($discountValue, $subtotalMinor);
        }

        return min(intdiv($subtotalMinor * $discountValue, 10000), $subtotalMinor);
    }

    private function resolveStatus(
        string $requestedStatus,
        string $dueDate,
        int $totalMinor,
        int $amountPaidMinor,
        int $refundedAmountMinor
    ): string {
        if ($requestedStatus === Invoice::STATUS_CANCELLED) {
            return Invoice::STATUS_CANCELLED;
        }

        if ($requestedStatus === Invoice::STATUS_DRAFT && $amountPaidMinor === 0 && $refundedAmountMinor === 0) {
            return Invoice::STATUS_DRAFT;
        }

        if ($refundedAmountMinor > 0 && $refundedAmountMinor >= max($amountPaidMinor, $totalMinor)) {
            return Invoice::STATUS_REFUNDED;
        }

        if ($amountPaidMinor >= $totalMinor) {
            return Invoice::STATUS_PAID;
        }

        if ($requestedStatus === Invoice::STATUS_OVERDUE || now()->startOfDay()->gt(Carbon::parse($dueDate)->startOfDay())) {
            return Invoice::STATUS_OVERDUE;
        }

        return Invoice::STATUS_UNPAID;
    }

    private function resolveStatusTimestamps(
        string $status,
        ?Invoice $invoice,
        int $amountPaidMinor,
        int $refundedAmountMinor
    ): array {
        return [
            'paid_at' => $amountPaidMinor > 0 ? ($invoice?->paid_at ?? now()) : null,
            'cancelled_at' => $status === Invoice::STATUS_CANCELLED ? ($invoice?->cancelled_at ?? now()) : null,
            'refunded_at' => $refundedAmountMinor > 0 ? ($invoice?->refunded_at ?? now()) : null,
        ];
    }

    private function extractInvoiceAttributes(array $summary): array
    {
        return Arr::only($summary, [
            'tenant_id',
            'client_id',
            'order_id',
            'user_id',
            'reference_number',
            'status',
            'currency',
            'issue_date',
            'due_date',
            'paid_at',
            'cancelled_at',
            'refunded_at',
            'recurring_cycle',
            'next_invoice_date',
            'discount_type',
            'discount_value',
            'discount_amount_minor',
            'credit_applied_minor',
            'tax_rate_bps',
            'tax_amount_minor',
            'subtotal_minor',
            'total_minor',
            'amount_paid_minor',
            'refunded_amount_minor',
            'balance_due_minor',
            'notes',
            'metadata',
        ]);
    }

    private function generateReferenceNumber(): string
    {
        return 'INV-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(6));
    }

    private function dispatchInvoiceCreatedNotification(Invoice $invoice): void
    {
        $invoice->loadMissing('client');
        $client = $invoice->client;

        if (! $client || ! filled($client->email)) {
            return;
        }

        $tenant = Tenant::query()->withoutGlobalScopes()->find($invoice->tenant_id);

        if (! $tenant) {
            return;
        }

        $this->notifications->send(
            email: $client->email,
            event: NotificationEventCatalog::EVENT_INVOICE_CREATED,
            context: [
                'client' => [
                    'name' => $client->display_name,
                    'email' => $client->email,
                ],
                'invoice' => [
                    'reference_number' => $invoice->reference_number,
                    'status' => $invoice->status,
                    'total' => number_format($invoice->total_minor / 100, 2).' '.$invoice->currency,
                    'due_date' => $invoice->due_date?->toDateString(),
                ],
            ],
            tenant: $tenant,
            locale: $client->preferred_locale ?: $tenant->default_locale,
        );
    }
}
