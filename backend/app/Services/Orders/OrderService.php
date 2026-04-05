<?php

namespace App\Services\Orders;

use App\Contracts\Repositories\Catalog\ProductRepositoryInterface;
use App\Contracts\Repositories\Clients\ClientRepositoryInterface;
use App\Contracts\Repositories\Orders\OrderRepositoryInterface;
use App\Models\ConfigurableOption;
use App\Models\Order;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Notifications\NotificationDispatchService;
use App\Services\Notifications\NotificationEventCatalog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orders,
        private readonly ClientRepositoryInterface $clients,
        private readonly ProductRepositoryInterface $products,
        private readonly NotificationDispatchService $notifications,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->orders->paginate($filters);
    }

    public function getForDisplay(Order $order): Order
    {
        return $this->orders->findByIdForDisplay($order->getKey()) ?? $order;
    }

    public function review(array $payload, User $actor): array
    {
        return $this->buildOrderSummary($payload, $actor);
    }

    public function create(array $payload, User $actor): Order
    {
        return DB::transaction(function () use ($payload, $actor): Order {
            $summary = $this->buildOrderSummary($payload, $actor, null, Order::STATUS_DRAFT);

            $order = $this->orders->create($this->extractOrderAttributes($summary));
            $this->orders->syncItems($order, $summary['items']);

            return $this->getForDisplay($order);
        });
    }

    public function place(array $payload, User $actor): Order
    {
        return DB::transaction(function () use ($payload, $actor): Order {
            $summary = $this->buildOrderSummary($payload, $actor, null, Order::STATUS_PENDING);

            $order = $this->orders->create($this->extractOrderAttributes($summary));
            $this->orders->syncItems($order, $summary['items']);
            $resolvedOrder = $this->getForDisplay($order);
            $this->dispatchOrderPlacedNotification($resolvedOrder);

            return $resolvedOrder;
        });
    }

    public function update(Order $order, array $payload, User $actor): Order
    {
        return DB::transaction(function () use ($order, $payload, $actor): Order {
            $status = $payload['status'] ?? $order->status;
            $summary = $this->buildOrderSummary($payload, $actor, $order, $status);

            $this->orders->update($order, $this->extractOrderAttributes($summary));
            $this->orders->syncItems($order, $summary['items']);

            return $this->getForDisplay($order);
        });
    }

    public function placeExisting(Order $order, User $actor): Order
    {
        if ($order->status !== Order::STATUS_DRAFT) {
            throw ValidationException::withMessages([
                'order' => ['Only draft orders can be placed.'],
            ]);
        }

        return DB::transaction(function () use ($order, $actor): Order {
            $this->orders->update($order, [
                'status' => Order::STATUS_PENDING,
                'placed_at' => $order->placed_at ?? now(),
                'user_id' => $order->user_id ?? $actor->id,
            ]);
            $resolvedOrder = $this->getForDisplay($order);
            $this->dispatchOrderPlacedNotification($resolvedOrder);

            return $resolvedOrder;
        });
    }

    private function dispatchOrderPlacedNotification(Order $order): void
    {
        $order->loadMissing('client');
        $client = $order->client;

        if (! $client || ! filled($client->email)) {
            return;
        }

        $tenant = Tenant::query()->withoutGlobalScopes()->find($order->tenant_id);

        if (! $tenant) {
            return;
        }

        $this->notifications->send(
            email: $client->email,
            event: NotificationEventCatalog::EVENT_ORDER_PLACED,
            context: [
                'client' => [
                    'name' => $client->display_name,
                    'email' => $client->email,
                ],
                'order' => [
                    'reference_number' => $order->reference_number,
                    'status' => $order->status,
                    'total' => number_format($order->total_minor / 100, 2).' '.$order->currency,
                ],
            ],
            tenant: $tenant,
            locale: $client->preferred_locale ?: $tenant->default_locale,
        );
    }

    public function delete(Order $order): void
    {
        if (! in_array($order->status, [Order::STATUS_DRAFT, Order::STATUS_CANCELLED], true)) {
            throw ValidationException::withMessages([
                'order' => ['Only draft or cancelled orders can be archived.'],
            ]);
        }

        $this->orders->delete($order);
    }

    private function buildOrderSummary(
        array $payload,
        User $actor,
        ?Order $order = null,
        ?string $forcedStatus = null
    ): array {
        $tenantId = $order?->tenant_id ?? $actor->tenant_id;

        if (blank($tenantId)) {
            throw ValidationException::withMessages([
                'tenant' => ['Tenant context is required for order management.'],
            ]);
        }

        $client = $this->clients->findById($payload['client_id']);

        if (! $client || $client->tenant_id !== $tenantId) {
            throw ValidationException::withMessages([
                'client_id' => ['The selected client is invalid for the current tenant.'],
            ]);
        }

        $items = collect($payload['items'] ?? [])
            ->values()
            ->map(fn (array $item) => $this->buildOrderItem($item, $tenantId))
            ->all();

        $subtotalMinor = (int) collect($items)->sum('subtotal_minor');
        $discountType = filled($payload['discount_type'] ?? null)
            ? (string) $payload['discount_type']
            : null;
        $discountValue = (int) ($payload['discount_value'] ?? 0);
        $discountAmountMinor = $this->resolveDiscountAmount($subtotalMinor, $discountType, $discountValue);
        $taxRateBps = (int) ($payload['tax_rate_bps'] ?? 0);
        $taxableBaseMinor = max($subtotalMinor - $discountAmountMinor, 0);
        $taxAmountMinor = intdiv($taxableBaseMinor * $taxRateBps, 10000);
        $status = $forcedStatus ?? ($payload['status'] ?? $order?->status ?? Order::STATUS_DRAFT);
        $timestamps = $this->resolveStatusTimestamps($status, $order);

        return [
            'tenant_id' => $tenantId,
            'client_id' => $client->id,
            'user_id' => $order?->user_id ?? $actor->id,
            'reference_number' => $order?->reference_number ?? $this->generateReferenceNumber(),
            'status' => $status,
            'currency' => Str::upper((string) ($payload['currency'] ?? $client->currency ?? config('hostinvo.default_currency', 'USD'))),
            'coupon_code' => filled($payload['coupon_code'] ?? null)
                ? Str::upper(trim((string) $payload['coupon_code']))
                : null,
            'discount_type' => $discountType,
            'discount_value' => $discountValue,
            'discount_amount_minor' => $discountAmountMinor,
            'tax_rate_bps' => $taxRateBps,
            'tax_amount_minor' => $taxAmountMinor,
            'subtotal_minor' => $subtotalMinor,
            'total_minor' => $taxableBaseMinor + $taxAmountMinor,
            'notes' => $payload['notes'] ?? null,
            'placed_at' => $timestamps['placed_at'],
            'accepted_at' => $timestamps['accepted_at'],
            'completed_at' => $timestamps['completed_at'],
            'cancelled_at' => $timestamps['cancelled_at'],
            'client' => [
                'id' => $client->id,
                'display_name' => $client->display_name,
                'email' => $client->email,
                'currency' => $client->currency,
                'preferred_locale' => $client->preferred_locale,
            ],
            'items' => $items,
        ];
    }

    private function buildOrderItem(array $payload, string $tenantId): array
    {
        $product = $this->products->findByIdForDisplay($payload['product_id']);

        if (! $product || $product->tenant_id !== $tenantId) {
            throw ValidationException::withMessages([
                'items' => ['One or more selected products are invalid for the current tenant.'],
            ]);
        }

        $pricing = collect($product->pricing ?? [])
            ->first(fn ($row) => $row->billing_cycle === $payload['billing_cycle'] && $row->is_enabled);

        if (! $pricing) {
            throw ValidationException::withMessages([
                'items' => ["The selected billing cycle is not available for {$product->name}."],
            ]);
        }

        $quantity = max(1, (int) ($payload['quantity'] ?? 1));
        $unitPriceMinor = $this->decimalStringToMinor((string) $pricing->price);
        $setupFeeMinor = $this->decimalStringToMinor((string) $pricing->setup_fee);
        $configurableOptions = $this->normalizeConfigurableSelections(
            $product,
            $payload['configurable_options'] ?? []
        );
        $lineSubtotalMinor = ($unitPriceMinor + $setupFeeMinor) * $quantity;

        return [
            'id' => $payload['id'] ?? null,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_type' => $product->type,
            'billing_cycle' => $payload['billing_cycle'],
            'quantity' => $quantity,
            'unit_price_minor' => $unitPriceMinor,
            'setup_fee_minor' => $setupFeeMinor,
            'subtotal_minor' => $lineSubtotalMinor,
            'total_minor' => $lineSubtotalMinor,
            'product_snapshot' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'sku' => $product->sku,
                'type' => $product->type,
            ],
            'configurable_options' => $configurableOptions,
        ];
    }

    private function normalizeConfigurableSelections(Product $product, array $selections): array
    {
        $options = collect($product->configurableOptions ?? [])->keyBy('id');
        $normalized = collect($selections)
            ->values()
            ->unique('configurable_option_id')
            ->map(function (array $selection) use ($options): array {
                $option = $options->get($selection['configurable_option_id'] ?? null);

                if (! $option instanceof ConfigurableOption) {
                    throw ValidationException::withMessages([
                        'items' => ['One or more configurable options are invalid for the selected product.'],
                    ]);
                }

                $selectedValue = $selection['selected_value'];
                $selectedLabel = null;

                if (in_array($option->option_type, [ConfigurableOption::TYPE_SELECT, ConfigurableOption::TYPE_RADIO], true)) {
                    $choice = collect($option->choices ?? [])
                        ->first(fn ($item) => $item->value === (string) $selectedValue);

                    if (! $choice) {
                        throw ValidationException::withMessages([
                            'items' => ["The selected value is invalid for {$option->name}."],
                        ]);
                    }

                    $selectedValue = $choice->value;
                    $selectedLabel = $choice->label;
                }

                if ($option->option_type === ConfigurableOption::TYPE_QUANTITY) {
                    if (! is_numeric($selectedValue) || (int) $selectedValue < 0) {
                        throw ValidationException::withMessages([
                            'items' => ["The selected quantity is invalid for {$option->name}."],
                        ]);
                    }

                    $selectedValue = (int) $selectedValue;
                    $selectedLabel = (string) $selectedValue;
                }

                if ($option->option_type === ConfigurableOption::TYPE_YES_NO) {
                    $selectedValue = filter_var($selectedValue, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

                    if ($selectedValue === null) {
                        throw ValidationException::withMessages([
                            'items' => ["The selected value is invalid for {$option->name}."],
                        ]);
                    }

                    $selectedLabel = $selectedValue ? 'Yes' : 'No';
                }

                return [
                    'configurable_option_id' => $option->id,
                    'name' => $option->name,
                    'code' => $option->code,
                    'option_type' => $option->option_type,
                    'selected_value' => $selectedValue,
                    'selected_label' => $selectedLabel ?? (string) $selectedValue,
                ];
            })
            ->values()
            ->all();

        $requiredOptionIds = collect($product->configurableOptions ?? [])
            ->filter(fn (ConfigurableOption $option) => $option->is_required)
            ->pluck('id')
            ->all();
        $selectedOptionIds = collect($normalized)->pluck('configurable_option_id')->all();
        $missingRequired = array_diff($requiredOptionIds, $selectedOptionIds);

        if ($missingRequired !== []) {
            throw ValidationException::withMessages([
                'items' => ['One or more required configurable options are missing.'],
            ]);
        }

        return $normalized;
    }

    private function resolveDiscountAmount(
        int $subtotalMinor,
        ?string $discountType,
        int $discountValue
    ): int {
        if ($discountType === null || $discountValue <= 0) {
            return 0;
        }

        if ($discountType === Order::DISCOUNT_FIXED) {
            return min($discountValue, $subtotalMinor);
        }

        return min(intdiv($subtotalMinor * $discountValue, 10000), $subtotalMinor);
    }

    private function resolveStatusTimestamps(string $status, ?Order $order): array
    {
        return [
            'placed_at' => $status === Order::STATUS_PENDING
                ? ($order?->placed_at ?? now())
                : $order?->placed_at,
            'accepted_at' => $status === Order::STATUS_ACCEPTED
                ? ($order?->accepted_at ?? now())
                : $order?->accepted_at,
            'completed_at' => $status === Order::STATUS_COMPLETED
                ? ($order?->completed_at ?? now())
                : $order?->completed_at,
            'cancelled_at' => in_array($status, [Order::STATUS_CANCELLED, Order::STATUS_FRAUD], true)
                ? ($order?->cancelled_at ?? now())
                : $order?->cancelled_at,
        ];
    }

    private function extractOrderAttributes(array $summary): array
    {
        return Arr::only($summary, [
            'tenant_id',
            'client_id',
            'user_id',
            'reference_number',
            'status',
            'currency',
            'coupon_code',
            'discount_type',
            'discount_value',
            'discount_amount_minor',
            'tax_rate_bps',
            'tax_amount_minor',
            'subtotal_minor',
            'total_minor',
            'notes',
            'placed_at',
            'accepted_at',
            'completed_at',
            'cancelled_at',
        ]);
    }

    private function generateReferenceNumber(): string
    {
        return 'ORD-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(6));
    }

    private function decimalStringToMinor(string $value): int
    {
        $normalized = preg_replace('/[^0-9.\-]/', '', trim($value)) ?? '0';

        if ($normalized === '' || $normalized === '-') {
            return 0;
        }

        $negative = str_starts_with($normalized, '-');
        $unsigned = ltrim($normalized, '-');
        [$whole, $decimal] = array_pad(explode('.', $unsigned, 2), 2, '0');
        $minor = ((int) $whole * 100) + (int) str_pad(substr($decimal, 0, 2), 2, '0');

        return $negative ? $minor * -1 : $minor;
    }
}
