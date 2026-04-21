<?php

namespace App\Services\Orders;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductPricing;
use App\Models\ProvisioningJob;
use App\Models\Server;
use App\Models\ServerPackage;
use App\Models\Service;
use App\Models\User;
use App\Provisioning\ProvisioningLogger;
use App\Services\Provisioning\ProvisioningService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class OrderFulfillmentService
{
    public function __construct(
        private readonly ProvisioningService $provisioning,
        private readonly ProvisioningLogger $logger,
    ) {
    }

    public function fulfillPaidInvoice(Invoice $invoice, ?User $actor = null): void
    {
        if ($invoice->status !== Invoice::STATUS_PAID || blank($invoice->order_id)) {
            return;
        }

        DB::transaction(function () use ($invoice, $actor): void {
            $order = Order::query()
                ->with(['items.product.server', 'owner', 'services.provisioningJobs'])
                ->where('tenant_id', $invoice->tenant_id)
                ->lockForUpdate()
                ->find($invoice->order_id);

            if (! $order || $order->client_id !== $invoice->client_id) {
                return;
            }

            $actor ??= $order->owner
                ?: User::query()->where('tenant_id', $order->tenant_id)->oldest()->first();

            if (! $actor) {
                return;
            }

            foreach ($order->items as $item) {
                $this->createMissingServicesForItem($order, $item, $actor);
            }

            $this->markOrderCompletedWhenServicesExist($order);
        });
    }

    private function createMissingServicesForItem(Order $order, OrderItem $item, User $actor): void
    {
        if (! $item->product || $item->product->type !== \App\Models\Product::TYPE_HOSTING) {
            return;
        }

        $existingCount = Service::query()
            ->where('tenant_id', $order->tenant_id)
            ->where('order_item_id', $item->id)
            ->count();

        $targetCount = max(1, (int) $item->quantity);

        for ($index = $existingCount; $index < $targetCount; $index++) {
            $service = $this->provisioning->createService([
                'client_id' => $order->client_id,
                'product_id' => $item->product_id,
                'order_id' => $order->id,
                'order_item_id' => $item->id,
                'server_id' => $item->product->server_id,
                'server_package_id' => $this->defaultPackageId($item),
                'service_type' => Service::TYPE_HOSTING,
                'billing_cycle' => $item->billing_cycle,
                'price' => $item->unit_price_minor,
                'currency' => $order->currency,
                'domain' => $this->resolveDomain($item),
                'username' => $this->resolveUsername($item),
                'registration_date' => now()->toDateString(),
                'next_due_date' => $this->nextDueDate($item->billing_cycle),
                'notes' => 'Created automatically after invoice payment.',
                'metadata' => [
                    'source' => 'paid_order',
                    'order_item_id' => $item->id,
                    'order_item_index' => $index + 1,
                ],
            ], $actor);

            $this->queueProvisioningWhenAvailable($service, $actor);
        }
    }

    private function queueProvisioningWhenAvailable(Service $service, User $actor): void
    {
        $service->loadMissing(['product', 'server', 'provisioningJobs']);
        $server = $service->server ?: $service->product?->server;
        $module = $service->product?->provisioning_module ?: $server?->panel_type;

        if (! $server || ! in_array($module, [Server::PANEL_CPANEL, Server::PANEL_PLESK], true)) {
            return;
        }

        if ($service->provisioningJobs()
            ->where('operation', ProvisioningJob::OPERATION_CREATE_ACCOUNT)
            ->whereIn('status', [
                ProvisioningJob::STATUS_QUEUED,
                ProvisioningJob::STATUS_PROCESSING,
                ProvisioningJob::STATUS_COMPLETED,
            ])
            ->exists()) {
            return;
        }

        try {
            $this->provisioning->dispatchOperation(
                service: $service,
                operation: ProvisioningJob::OPERATION_CREATE_ACCOUNT,
                actor: $actor,
                payload: array_filter([
                    'server_id' => $server->id,
                    'server_package_id' => $this->defaultPackageIdForService($service, $server),
                    'panel_package_name' => $service->product?->provisioning_package,
                    'domain' => $service->domain,
                    'username' => $service->username,
                ], static fn (mixed $value): bool => filled($value)),
            );
        } catch (Throwable $exception) {
            $this->logger->recordServiceNote(
                $service,
                'Automatic provisioning was not queued: '.$exception->getMessage(),
                ['source' => 'paid_order_fulfillment']
            );
        }
    }

    private function markOrderCompletedWhenServicesExist(Order $order): void
    {
        $expected = (int) $order->items
            ->filter(fn (OrderItem $item) => $item->product?->type === \App\Models\Product::TYPE_HOSTING)
            ->sum(fn (OrderItem $item) => max(1, (int) $item->quantity));

        if ($expected < 1) {
            return;
        }

        $actual = Service::query()
            ->where('tenant_id', $order->tenant_id)
            ->where('order_id', $order->id)
            ->count();

        if ($actual < $expected) {
            return;
        }

        $order->forceFill([
            'status' => Order::STATUS_COMPLETED,
            'completed_at' => $order->completed_at ?? now(),
        ])->save();
    }

    private function defaultPackageId(OrderItem $item): ?int
    {
        if (! $item->product?->server_id) {
            return null;
        }

        return ServerPackage::query()
            ->where('tenant_id', $item->tenant_id)
            ->where('server_id', $item->product->server_id)
            ->where('product_id', $item->product_id)
            ->orderByDesc('is_default')
            ->value('id');
    }

    private function defaultPackageIdForService(Service $service, Server $server): ?int
    {
        return $service->server_package_id
            ?: ServerPackage::query()
                ->where('tenant_id', $service->tenant_id)
                ->where('server_id', $server->id)
                ->where('product_id', $service->product_id)
                ->orderByDesc('is_default')
                ->value('id');
    }

    private function resolveDomain(OrderItem $item): ?string
    {
        if (filled($item->domain)) {
            return $item->domain;
        }

        foreach ((array) ($item->configurable_options ?? []) as $option) {
            $code = strtolower((string) ($option['code'] ?? ''));

            if (in_array($code, ['domain', 'hostname'], true) && filled($option['selected_value'] ?? null)) {
                return (string) $option['selected_value'];
            }
        }

        return null;
    }

    private function resolveUsername(OrderItem $item): ?string
    {
        $domain = $this->resolveDomain($item);

        if (blank($domain)) {
            return null;
        }

        $username = strtolower(preg_replace('/[^a-z0-9]/', '', Str::before($domain, '.')) ?? '');

        if ($username === '') {
            return null;
        }

        if (is_numeric($username[0])) {
            $username = 'h'.$username;
        }

        return substr($username, 0, 16);
    }

    private function nextDueDate(string $billingCycle): string
    {
        return match ($billingCycle) {
            ProductPricing::CYCLE_QUARTERLY => now()->addMonthsNoOverflow(3)->toDateString(),
            ProductPricing::CYCLE_SEMIANNUALLY => now()->addMonthsNoOverflow(6)->toDateString(),
            ProductPricing::CYCLE_ANNUALLY => now()->addMonthsNoOverflow(12)->toDateString(),
            ProductPricing::CYCLE_BIENNIALLY => now()->addMonthsNoOverflow(24)->toDateString(),
            ProductPricing::CYCLE_TRIENNIALLY => now()->addMonthsNoOverflow(36)->toDateString(),
            default => now()->addMonthNoOverflow()->toDateString(),
        };
    }
}
