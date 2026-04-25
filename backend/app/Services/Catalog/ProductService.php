<?php

namespace App\Services\Catalog;

use App\Contracts\Repositories\Catalog\ProductRepositoryInterface;
use App\Contracts\Repositories\Provisioning\ServerRepositoryInterface;
use App\Models\ConfigurableOption;
use App\Models\Product;
use App\Models\ProductPricing;
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

    public function duplicate(Product $product, User $actor): Product
    {
        return DB::transaction(function () use ($product, $actor): Product {
            $source = $this->products->findByIdForDisplay($product->id) ?? $product->load([
                'pricing',
                'configurableOptions.choices',
                'addons',
            ]);

            $copy = new Product();
            $copy->forceFill([
                'tenant_id' => $source->tenant_id,
                'product_group_id' => $source->product_group_id,
                'server_id' => $source->server_id,
                'type' => $source->type,
                'provisioning_module' => $source->provisioning_module,
                'provisioning_package' => $source->provisioning_package,
                'name' => $this->copyName($source->name),
                'tagline' => $source->tagline,
                'slug' => $this->uniqueProductSlug($source->tenant_id, $source->slug.'-copy'),
                'sku' => $source->sku ? $this->uniqueProductSku($source->tenant_id, $source->sku.'-COPY') : null,
                'summary' => $source->summary,
                'description' => $source->description,
                'color' => $source->color,
                'status' => Product::STATUS_DRAFT,
                'visibility' => Product::VISIBILITY_HIDDEN,
                'display_order' => $source->display_order,
                'is_featured' => false,
                'welcome_email' => $source->welcome_email,
                'require_domain' => $source->require_domain,
                'stock_control' => $source->stock_control,
                'stock_quantity' => $source->stock_quantity,
                'apply_tax' => $source->apply_tax,
                'retired' => false,
                'payment_type' => $source->payment_type,
                'allow_multiple_quantities' => $source->allow_multiple_quantities,
                'recurring_cycles_limit' => $source->recurring_cycles_limit,
                'auto_terminate_days' => $source->auto_terminate_days,
                'termination_email' => $source->termination_email,
                'prorata_billing' => $source->prorata_billing,
                'prorata_date' => $source->prorata_date,
                'charge_next_month' => $source->charge_next_month,
            ])->save();

            $source->pricing->each(function (ProductPricing $pricing) use ($copy): void {
                $copy->pricing()->create([
                    'tenant_id' => $copy->tenant_id,
                    'billing_cycle' => $pricing->billing_cycle,
                    'currency' => $pricing->currency,
                    'price' => $pricing->price,
                    'setup_fee' => $pricing->setup_fee,
                    'is_enabled' => $pricing->is_enabled,
                ]);
            });

            $source->configurableOptions->each(function (ConfigurableOption $option) use ($copy): void {
                $copiedOption = $copy->configurableOptions()->create([
                    'tenant_id' => $copy->tenant_id,
                    'name' => $option->name,
                    'code' => $option->code,
                    'option_type' => $option->option_type,
                    'description' => $option->description,
                    'status' => $option->status,
                    'is_required' => $option->is_required,
                    'display_order' => $option->display_order,
                ]);

                $option->choices->each(function ($choice) use ($copy, $copiedOption): void {
                    $copiedOption->choices()->create([
                        'tenant_id' => $copy->tenant_id,
                        'label' => $choice->label,
                        'value' => $choice->value,
                        'price_modifier' => $choice->price_modifier,
                        'is_default' => $choice->is_default,
                        'display_order' => $choice->display_order,
                        'sort_order' => $choice->sort_order,
                    ]);
                });
            });

            $copy->addons()->sync($source->addons->pluck('id')->all());
            $this->syncDefaultServerPackage($copy, [
                'server_id' => $copy->server_id,
                'provisioning_package' => $copy->provisioning_package,
            ]);

            return $this->getForDisplay($copy);
        });
    }

    public function delete(Product $product): void
    {
        $this->products->delete($product);
    }

    private function copyName(string $name): string
    {
        $base = "Copy of {$name}";

        return Str::limit($base, 255, '');
    }

    private function uniqueProductSlug(string $tenantId, string $baseSlug): string
    {
        $baseSlug = Str::slug($baseSlug) ?: 'product-copy';
        $candidate = $baseSlug;
        $suffix = 2;

        while (Product::query()->where('tenant_id', $tenantId)->where('slug', $candidate)->exists()) {
            $candidate = Str::limit("{$baseSlug}-{$suffix}", 255, '');
            $suffix++;
        }

        return $candidate;
    }

    private function uniqueProductSku(string $tenantId, string $baseSku): string
    {
        $baseSku = Str::upper(Str::slug($baseSku, '-'));
        $candidate = Str::limit($baseSku, 100, '');
        $suffix = 2;

        while (Product::query()->where('tenant_id', $tenantId)->where('sku', $candidate)->exists()) {
            $candidate = Str::limit("{$baseSku}-{$suffix}", 100, '');
            $suffix++;
        }

        return $candidate;
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
