<?php

namespace App\Services\Provisioning;

use App\Models\Product;
use App\Models\ProductPricing;
use App\Models\ProvisioningLog;
use App\Models\Server;
use App\Models\ServerPackage;
use App\Models\Tenant;
use App\Models\User;
use App\Provisioning\Drivers\Plesk\PleskApiClient;
use App\Provisioning\ProvisioningLogger;
use App\Services\Catalog\ProductService;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PleskPlanImportService
{
    public function __construct(
        private readonly PleskApiClient $plesk,
        private readonly ProductService $products,
        private readonly ProvisioningLogger $logger,
    ) {
    }

    public function previewPlans(Server $server, array $filters = []): array
    {
        $server = $this->resolveImportableServer($server);
        $search = Str::lower(trim((string) ($filters['search'] ?? '')));

        $records = collect($this->plesk->listServicePlans($server))
            ->map(fn (string $planName) => $this->buildPreviewRecord($server, $planName))
            ->when(
                $search !== '',
                fn ($collection) => $collection->filter(function (array $record) use ($search): bool {
                    return collect([
                        $record['plan_name'],
                        $record['owner_name'],
                        Arr::get($record, 'existing_product.name'),
                    ])->filter()
                        ->contains(fn (string $value): bool => Str::contains(Str::lower($value), $search));
                })
            )
            ->sortBy('plan_name', SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        return [
            'data' => $records->all(),
            'meta' => [
                'total' => $records->count(),
                'already_imported' => $records->whereNotNull('existing_product')->count(),
                'ready_to_import' => $records->whereNull('existing_product')->count(),
            ],
        ];
    }

    public function importPlans(Server $server, array $payload, User $actor): array
    {
        $server = $this->resolveImportableServer($server);
        $tenant = Tenant::query()->findOrFail($server->tenant_id);
        $products = [];
        $createdProducts = [];
        $mappedProducts = [];

        DB::transaction(function () use ($server, $tenant, $payload, $actor, &$products, &$createdProducts, &$mappedProducts): void {
            foreach ($payload['imports'] as $index => $row) {
                $preview = $this->buildPreviewRecord($server, (string) $row['plan_name']);
                $product = $this->resolveOrCreateProduct($server, $tenant, $preview, $row, $actor, $index);

                $this->syncServerPackage($server, $product, $preview);
                $products[] = $this->products->getForDisplay($product);

                if (Arr::get($preview, 'existing_product.id')) {
                    $mappedProducts[] = $product->id;
                } else {
                    $createdProducts[] = $product->id;
                }
            }

            $this->logger->recordServerEvent(
                server: $server,
                operation: 'import_service_plans',
                status: ProvisioningLog::STATUS_COMPLETED,
                message: sprintf('Imported or mapped %d Plesk service plan(s).', count($products)),
                requestPayload: [
                    'actor_user_id' => $actor->id,
                    'plans' => collect($payload['imports'])->pluck('plan_name')->values()->all(),
                ],
                responsePayload: [
                    'products' => collect($products)->pluck('id')->values()->all(),
                    'created_products' => $createdProducts,
                    'mapped_products' => $mappedProducts,
                ],
            );
        });

        return [
            'products' => $products,
            'summary' => [
                'products_created' => count($createdProducts),
                'products_mapped' => count($mappedProducts),
            ],
        ];
    }

    private function resolveImportableServer(Server $server): Server
    {
        $server = $server->fresh(['packages.product']) ?? $server;

        if ($server->panel_type !== Server::PANEL_PLESK) {
            throw ValidationException::withMessages([
                'server' => ['Service-plan import is currently available only for Plesk servers.'],
            ]);
        }

        return $server;
    }

    private function buildPreviewRecord(Server $server, string $planName): array
    {
        $planName = trim($planName);
        $info = $this->plesk->servicePlanInfo($server, $planName);
        $existingPackage = $this->findExistingServerPackage($server, $planName);
        $existingProduct = $existingPackage?->product ?? $this->findExistingProduct($server, $planName);

        return [
            'plan_name' => $planName,
            'owner_name' => $this->extractString($info, ['owner_login', 'owner', 'reseller', 'customer']),
            'disk_limit_mb' => $this->toMegabytes($this->extractString($info, ['disk_space', 'hard_disk_quota', 'disk_limit'])),
            'bandwidth_limit_mb' => $this->toMegabytes($this->extractString($info, ['traffic', 'traffic_limit', 'max_traffic'])),
            'websites_limit' => $this->toInteger($this->extractString($info, ['max_site', 'domains', 'websites'])),
            'mailboxes_limit' => $this->toInteger($this->extractString($info, ['max_box', 'mailboxes', 'mail_accounts'])),
            'databases_limit' => $this->toInteger($this->extractString($info, ['max_db', 'databases', 'database_count'])),
            'existing_server_package' => $existingPackage ? [
                'id' => (string) $existingPackage->id,
                'panel_package_name' => $existingPackage->panel_package_name,
                'display_name' => $existingPackage->display_name,
            ] : null,
            'existing_product' => $existingProduct ? [
                'id' => $existingProduct->id,
                'name' => $existingProduct->name,
                'slug' => $existingProduct->slug,
            ] : null,
            'raw_info' => Arr::only($info, [
                'name',
                'owner',
                'owner_login',
                'reseller',
                'disk_space',
                'hard_disk_quota',
                'traffic',
                'traffic_limit',
                'max_traffic',
                'max_site',
                'domains',
                'websites',
                'max_box',
                'mailboxes',
                'mail_accounts',
                'max_db',
                'databases',
                'database_count',
            ]),
        ];
    }

    private function resolveOrCreateProduct(
        Server $server,
        Tenant $tenant,
        array $preview,
        array $row,
        User $actor,
        int $index,
    ): Product {
        $existingProductId = Arr::get($preview, 'existing_product.id');

        if ($existingProductId) {
            $product = Product::query()->find($existingProductId);

            if (! $product || $product->tenant_id !== $tenant->id) {
                throw ValidationException::withMessages([
                    "imports.{$index}.plan_name" => ['The existing product mapping is invalid for this tenant.'],
                ]);
            }

            return $product;
        }

        $planName = (string) $preview['plan_name'];
        $productName = trim((string) ($row['product_name'] ?? $planName));

        if ($productName === '') {
            throw ValidationException::withMessages([
                "imports.{$index}.product_name" => ['A product name is required when importing a new Plesk plan.'],
            ]);
        }

        $product = $this->products->create([
            'product_group_id' => $row['product_group_id'] ?? null,
            'server_id' => $server->id,
            'type' => Product::TYPE_HOSTING,
            'provisioning_module' => Product::MODULE_PLESK,
            'provisioning_package' => $planName,
            'name' => $productName,
            'summary' => sprintf('Imported from Plesk service plan %s.', $planName),
            'description' => $this->buildDescription($preview),
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_HIDDEN,
            'display_order' => 0,
            'is_featured' => false,
        ], $actor);

        $this->products->updatePricing($product, [
            'pricing' => [[
                'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
                'currency' => Str::upper((string) ($tenant->default_currency ?: config('hostinvo.default_currency', 'USD'))),
                'price' => 0,
                'setup_fee' => 0,
                'is_enabled' => true,
            ]],
        ]);

        return Product::query()->findOrFail($product->id);
    }

    private function syncServerPackage(Server $server, Product $product, array $preview): void
    {
        $planName = (string) $preview['plan_name'];

        ServerPackage::query()->updateOrCreate(
            [
                'tenant_id' => $server->tenant_id,
                'server_id' => $server->id,
                'product_id' => $product->id,
            ],
            [
                'panel_package_name' => $planName,
                'display_name' => $product->name,
                'is_default' => true,
                'metadata' => array_filter([
                    'source' => 'plesk_plan_import',
                    'owner_name' => $preview['owner_name'],
                    'disk_limit_mb' => $preview['disk_limit_mb'],
                    'bandwidth_limit_mb' => $preview['bandwidth_limit_mb'],
                    'websites_limit' => $preview['websites_limit'],
                    'mailboxes_limit' => $preview['mailboxes_limit'],
                    'databases_limit' => $preview['databases_limit'],
                ], static fn (mixed $value): bool => $value !== null),
            ],
        );
    }

    private function findExistingServerPackage(Server $server, string $planName): ?ServerPackage
    {
        $packages = $server->relationLoaded('packages')
            ? $server->packages
            : $server->packages()->with('product')->get();

        return $packages
            ->first(fn (ServerPackage $package): bool => Str::lower($package->panel_package_name) === Str::lower($planName))
            ?? $packages->first(fn (ServerPackage $package): bool => Str::lower((string) ($package->display_name ?? '')) === Str::lower($planName));
    }

    private function findExistingProduct(Server $server, string $planName): ?Product
    {
        return Product::query()
            ->where('tenant_id', $server->tenant_id)
            ->where('server_id', $server->id)
            ->where('provisioning_module', Product::MODULE_PLESK)
            ->where(function ($query) use ($planName): void {
                $query
                    ->whereRaw('LOWER(provisioning_package) = ?', [Str::lower($planName)])
                    ->orWhereRaw('LOWER(name) = ?', [Str::lower($planName)]);
            })
            ->first();
    }

    private function buildDescription(array $preview): string
    {
        $lines = collect([
            sprintf('Imported from Plesk service plan %s.', $preview['plan_name']),
            $preview['disk_limit_mb'] ? sprintf('Disk limit: %d MB', $preview['disk_limit_mb']) : null,
            $preview['bandwidth_limit_mb'] ? sprintf('Bandwidth limit: %d MB', $preview['bandwidth_limit_mb']) : null,
            $preview['websites_limit'] ? sprintf('Websites: %d', $preview['websites_limit']) : null,
            $preview['mailboxes_limit'] ? sprintf('Mailboxes: %d', $preview['mailboxes_limit']) : null,
            $preview['databases_limit'] ? sprintf('Databases: %d', $preview['databases_limit']) : null,
        ])->filter();

        return $lines->implode("\n");
    }

    private function extractString(array $info, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = $info[$key] ?? null;

            if (filled($value)) {
                return trim((string) $value);
            }
        }

        return null;
    }

    private function toMegabytes(?string $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (Str::contains(Str::lower($value), ['unlimited', 'infinity'])) {
            return null;
        }

        if (is_numeric($value)) {
            return max(0, (int) round((float) $value));
        }

        if (! preg_match('/([\d.]+)\s*([a-zA-Z]*)/', trim($value), $matches)) {
            return null;
        }

        $amount = (float) $matches[1];
        $unit = Str::lower($matches[2] ?: 'mb');

        return match ($unit) {
            'tb' => (int) round($amount * 1024 * 1024),
            'gb' => (int) round($amount * 1024),
            'mb', 'm' => (int) round($amount),
            'kb', 'k' => (int) round($amount / 1024),
            'b', 'bytes' => (int) round($amount / (1024 * 1024)),
            default => (int) round($amount),
        };
    }

    private function toInteger(?string $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (Str::contains(Str::lower($value), ['unlimited', 'infinity'])) {
            return null;
        }

        if (! preg_match('/-?\d+/', $value, $matches)) {
            return null;
        }

        return (int) $matches[0];
    }
}
