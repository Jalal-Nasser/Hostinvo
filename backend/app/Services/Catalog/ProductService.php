<?php

namespace App\Services\Catalog;

use App\Contracts\Repositories\Catalog\ProductRepositoryInterface;
use App\Contracts\Repositories\Provisioning\ServerRepositoryInterface;
use App\Models\Product;
use App\Models\ServerPackage;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductService
{
    public function __construct(
        private readonly ProductRepositoryInterface $products,
        private readonly ServerRepositoryInterface $servers,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->products->paginate($filters);
    }

    public function getForDisplay(Product $product): Product
    {
        return $this->products->findByIdForDisplay($product->getKey()) ?? $product;
    }

    public function create(array $payload, User $actor): Product
    {
        return DB::transaction(function () use ($payload, $actor): Product {
            $product = $this->products->create($this->normalizeAttributes($payload, $actor));

            if (array_key_exists('configurable_options', $payload)) {
                $this->products->syncConfigurableOptions(
                    $product,
                    $this->normalizeConfigurableOptions($payload['configurable_options'] ?? [])
                );
            }

            $this->syncDefaultServerPackage($product, $payload);

            return $this->getForDisplay($product);
        });
    }

    public function update(Product $product, array $payload, User $actor): Product
    {
        return DB::transaction(function () use ($product, $payload, $actor): Product {
            $this->products->update($product, $this->normalizeAttributes($payload, $actor, $product));

            if (array_key_exists('configurable_options', $payload)) {
                $this->products->syncConfigurableOptions(
                    $product,
                    $this->normalizeConfigurableOptions($payload['configurable_options'] ?? [])
                );
            }

            $this->syncDefaultServerPackage($product->refresh(), $payload);

            return $this->getForDisplay($product);
        });
    }

    public function updatePricing(Product $product, array $payload): Product
    {
        DB::transaction(function () use ($product, $payload): void {
            $this->products->syncPricing($product, $this->normalizePricing($payload['pricing']));
        });

        return $this->getForDisplay($product);
    }

    public function delete(Product $product): void
    {
        $this->products->delete($product);
    }

    private function normalizeAttributes(array $payload, User $actor, ?Product $product = null): array
    {
        $tenantId = $product?->tenant_id ?? $actor->tenant_id;

        if (blank($tenantId)) {
            throw ValidationException::withMessages([
                'tenant' => ['Tenant context is required for product management.'],
            ]);
        }

        $slug = filled($payload['slug'] ?? null)
            ? Str::slug((string) $payload['slug'])
            : Str::slug((string) $payload['name']);

        $server = null;
        $serverId = $payload['server_id'] ?? null;

        if (filled($serverId)) {
            $server = $this->servers->findById((string) $serverId);

            if (! $server || $server->tenant_id !== $tenantId) {
                throw ValidationException::withMessages([
                    'server_id' => ['The selected server is invalid for the current tenant.'],
                ]);
            }
        }

        $provisioningModule = $payload['provisioning_module'] ?? $product?->provisioning_module ?? $server?->panel_type;

        return array_merge(
            Arr::only($payload, [
                'product_group_id',
                'server_id',
                'type',
                'provisioning_package',
                'name',
                'tagline',
                'sku',
                'summary',
                'description',
                'color',
                'welcome_email',
                'require_domain',
                'stock_control',
                'stock_quantity',
                'apply_tax',
                'retired',
                'payment_type',
                'allow_multiple_quantities',
                'recurring_cycles_limit',
                'auto_terminate_days',
                'termination_email',
                'prorata_billing',
                'prorata_date',
                'charge_next_month',
                'status',
                'visibility',
                'display_order',
                'is_featured',
            ]),
            [
                'tenant_id' => $tenantId,
                'provisioning_module' => $provisioningModule,
                'slug' => $slug,
            ]
        );
    }

    private function syncDefaultServerPackage(Product $product, array $payload): void
    {
        $serverId = $payload['server_id'] ?? $product->server_id;
        $packageName = trim((string) ($payload['provisioning_package'] ?? $product->provisioning_package ?? ''));

        if (blank($serverId) || $packageName === '') {
            return;
        }

        ServerPackage::query()->updateOrCreate(
            [
                'tenant_id' => $product->tenant_id,
                'server_id' => $serverId,
                'product_id' => $product->id,
            ],
            [
                'panel_package_name' => $packageName,
                'display_name' => $product->name,
                'is_default' => true,
                'metadata' => [
                    'source' => 'product_assignment',
                    'provisioning_module' => $product->provisioning_module,
                ],
            ],
        );
    }

    private function normalizePricing(array $pricing): array
    {
        return collect($pricing)
            ->values()
            ->unique('billing_cycle')
            ->map(fn (array $row): array => [
                'billing_cycle' => $row['billing_cycle'],
                'currency' => Str::upper($row['currency']),
                'price' => number_format((float) $row['price'], 2, '.', ''),
                'setup_fee' => number_format((float) ($row['setup_fee'] ?? 0), 2, '.', ''),
                'is_enabled' => (bool) ($row['is_enabled'] ?? false),
            ])
            ->all();
    }

    private function normalizeConfigurableOptions(array $options): array
    {
        return collect($options)
            ->values()
            ->map(function (array $option, int $index): array {
                return [
                    'id' => $option['id'] ?? null,
                    'name' => $option['name'],
                    'code' => filled($option['code'] ?? null)
                        ? Str::slug((string) $option['code'], '_')
                        : Str::slug((string) $option['name'], '_'),
                    'option_type' => $option['option_type'],
                    'description' => $option['description'] ?? null,
                    'status' => $option['status'],
                    'is_required' => (bool) ($option['is_required'] ?? false),
                    'display_order' => (int) ($option['display_order'] ?? $index),
                    'choices' => collect($option['choices'] ?? [])
                        ->values()
                        ->map(function (array $choice, int $choiceIndex): array {
                            return [
                                'id' => $choice['id'] ?? null,
                                'label' => $choice['label'],
                                'value' => filled($choice['value'] ?? null)
                                    ? (string) $choice['value']
                                    : Str::slug((string) $choice['label'], '_'),
                                'is_default' => (bool) ($choice['is_default'] ?? false),
                                'display_order' => (int) ($choice['display_order'] ?? $choiceIndex),
                            ];
                        })
                        ->all(),
                ];
            })
            ->all();
    }
}
