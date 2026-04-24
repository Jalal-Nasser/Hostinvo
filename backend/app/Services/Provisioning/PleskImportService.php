<?php

namespace App\Services\Provisioning;

use App\Contracts\Repositories\Catalog\ProductRepositoryInterface;
use App\Contracts\Repositories\Clients\ClientRepositoryInterface;
use App\Contracts\Repositories\Provisioning\ServerRepositoryInterface;
use App\Contracts\Repositories\Provisioning\ServiceRepositoryInterface;
use App\Models\Client;
use App\Models\Product;
use App\Models\ProductPricing;
use App\Models\ProvisioningLog;
use App\Models\Server;
use App\Models\ServerPackage;
use App\Models\Service;
use App\Models\ServiceCredential;
use App\Models\Tenant;
use App\Models\User;
use App\Provisioning\Drivers\Plesk\PleskApiClient;
use App\Provisioning\ProvisioningLogger;
use App\Services\Licensing\LicenseService;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PleskImportService
{
    public function __construct(
        private readonly PleskApiClient $plesk,
        private readonly ProductRepositoryInterface $products,
        private readonly ClientRepositoryInterface $clients,
        private readonly ServiceRepositoryInterface $services,
        private readonly ServerRepositoryInterface $servers,
        private readonly LicenseService $licenseService,
        private readonly ProvisioningLogger $logger,
    ) {
    }

    public function previewSubscriptions(Server $server, array $filters = []): array
    {
        $server = $this->resolveImportableServer($server);
        $search = Str::lower(trim((string) ($filters['search'] ?? '')));

        $records = collect($this->plesk->listSubscriptions($server))
            ->map(fn (string $subscription) => $this->buildPreviewRecord($server, $subscription))
            ->when(
                $search !== '',
                fn ($collection) => $collection->filter(function (array $record) use ($search): bool {
                    return collect([
                        $record['subscription_name'],
                        $record['domain'],
                        $record['username'],
                        $record['service_plan'],
                        $record['email'],
                        $record['owner_name'],
                    ])->filter()
                        ->contains(fn (string $value): bool => Str::contains(Str::lower($value), $search));
                })
            )
            ->sortBy('subscription_name', SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        return [
            'data' => $records->all(),
            'meta' => [
                'total' => $records->count(),
                'already_imported' => $records->whereNotNull('existing_service')->count(),
                'ready_to_import' => $records
                    ->whereNull('existing_service')
                    ->where('requires_product_selection', false)
                    ->count(),
            ],
        ];
    }

    public function importSubscriptions(Server $server, array $payload, User $actor): array
    {
        $server = $this->resolveImportableServer($server);
        $tenant = Tenant::query()->findOrFail($server->tenant_id);
        $createdServices = [];
        $createdClients = [];

        DB::transaction(function () use ($server, $tenant, $payload, $actor, &$createdServices, &$createdClients): void {
            foreach ($payload['imports'] as $index => $row) {
                $preview = $this->buildPreviewRecord($server, (string) $row['subscription_name']);

                if ($preview['existing_service']) {
                    throw ValidationException::withMessages([
                        "imports.{$index}.subscription_name" => ['This Plesk subscription is already imported.'],
                    ]);
                }

                $product = $this->resolveImportProduct($row, $preview, $tenant->id, $index);
                $client = $this->resolveImportClient($row, $preview, $tenant, $actor, $index);
                $service = $this->createImportedService($server, $tenant, $product, $client, $preview, $row, $actor);

                $createdServices[] = $service->id;

                if ($client->wasRecentlyCreated) {
                    $createdClients[] = $client->id;
                }
            }

            if ($createdServices !== []) {
                $server->current_accounts = $server->current_accounts + count($createdServices);
                $server->save();
            }

            $this->logger->recordServerEvent(
                server: $server,
                operation: 'import_existing_accounts',
                status: ProvisioningLog::STATUS_COMPLETED,
                message: sprintf('Imported %d existing Plesk subscription(s).', count($createdServices)),
                requestPayload: [
                    'actor_user_id' => $actor->id,
                    'imports' => collect($payload['imports'])->pluck('subscription_name')->values()->all(),
                ],
                responsePayload: [
                    'imported_services' => $createdServices,
                    'created_clients' => $createdClients,
                ],
            );
        });

        $services = collect($createdServices)
            ->map(fn (string $serviceId) => $this->services->findByIdForDisplay($serviceId))
            ->filter()
            ->values();

        return [
            'imported' => $services->all(),
            'summary' => [
                'services_created' => count($createdServices),
                'clients_created' => count($createdClients),
            ],
        ];
    }

    private function resolveImportableServer(Server $server): Server
    {
        $server = $this->servers->findByIdForDisplay((string) $server->getKey()) ?? $server;

        if ($server->panel_type !== Server::PANEL_PLESK) {
            throw ValidationException::withMessages([
                'server' => ['Existing-account import is currently available only for Plesk servers.'],
            ]);
        }

        return $server;
    }

    private function buildPreviewRecord(Server $server, string $subscription): array
    {
        $subscription = trim($subscription);
        $info = $this->plesk->subscriptionInfo($server, $subscription);
        $domain = trim((string) ($info['subscription'] ?? $info['domain_name'] ?? $subscription));
        $email = $this->extractString($info, ['contact_email', 'email']);
        $ownerName = $this->extractString($info, ['customer_name', 'customer', 'owner_name', 'owner']);
        $servicePlan = $this->extractString($info, ['service_plan', 'plan']);
        $username = $this->extractString($info, ['system_user', 'login', 'username']);
        $existingService = $this->findExistingService($server, $subscription, $domain);
        $matchedClient = $this->findMatchedClient($server->tenant_id, $email);
        $package = $this->findSuggestedServerPackage($server, $servicePlan);

        return [
            'subscription_name' => $subscription,
            'domain' => $domain,
            'username' => $username,
            'service_plan' => $servicePlan,
            'email' => $email,
            'owner_name' => $ownerName,
            'status' => $this->mapServiceStatus($this->extractString($info, ['status', 'subscription_status']) ?? 'active'),
            'raw_status' => $this->extractString($info, ['status', 'subscription_status']),
            'disk_used_mb' => $this->toMegabytes($this->extractString($info, ['disk_space', 'disk_usage', 'disk_quota_used'])),
            'disk_limit_mb' => $this->toMegabytes($this->extractString($info, ['hard_disk_quota', 'disk_space_limit', 'disk_limit'])),
            'bandwidth_used_mb' => $this->toMegabytes($this->extractString($info, ['traffic', 'traffic_used', 'bandwidth_usage'])),
            'bandwidth_limit_mb' => $this->toMegabytes($this->extractString($info, ['traffic_limit', 'bandwidth_limit'])),
            'email_accounts_used' => (int) ($info['mailboxes'] ?? $info['email_accounts'] ?? 0),
            'databases_used' => (int) ($info['databases'] ?? $info['database_count'] ?? 0),
            'existing_service' => $existingService ? [
                'id' => $existingService->id,
                'reference_number' => $existingService->reference_number,
                'status' => $existingService->status,
            ] : null,
            'matched_client' => $matchedClient ? [
                'id' => $matchedClient->id,
                'display_name' => $matchedClient->display_name,
                'email' => $matchedClient->email,
            ] : null,
            'suggested_server_package' => $package ? [
                'id' => (string) $package->id,
                'panel_package_name' => $package->panel_package_name,
                'display_name' => $package->display_name,
            ] : null,
            'suggested_product' => $package?->product ? [
                'id' => $package->product->id,
                'name' => $package->product->name,
            ] : null,
            'requires_product_selection' => $package?->product === null,
            'raw_info' => Arr::only($info, [
                'subscription',
                'status',
                'subscription_status',
                'service_plan',
                'system_user',
                'contact_email',
                'email',
                'customer_name',
                'customer',
                'owner_name',
                'owner',
                'disk_space',
                'hard_disk_quota',
                'traffic',
                'traffic_limit',
                'mailboxes',
                'databases',
            ]),
        ];
    }

    private function findExistingService(Server $server, string $subscription, string $domain): ?Service
    {
        return Service::query()
            ->where('tenant_id', $server->tenant_id)
            ->where('server_id', $server->id)
            ->where(function ($query) use ($subscription, $domain): void {
                $query
                    ->where('external_reference', $subscription)
                    ->orWhere('domain', $domain);
            })
            ->first();
    }

    private function findMatchedClient(string $tenantId, ?string $email): ?Client
    {
        if (! filled($email)) {
            return null;
        }

        return Client::query()
            ->where('tenant_id', $tenantId)
            ->whereRaw('LOWER(email) = ?', [Str::lower($email)])
            ->first();
    }

    private function findSuggestedServerPackage(Server $server, ?string $servicePlan): ?ServerPackage
    {
        if (! filled($servicePlan)) {
            return null;
        }

        $packages = $server->relationLoaded('packages')
            ? $server->packages
            : $server->packages()->with('product')->get();

        return $packages
            ->first(fn (ServerPackage $package): bool => Str::lower($package->panel_package_name) === Str::lower((string) $servicePlan))
            ?? $packages->first(fn (ServerPackage $package): bool => Str::lower((string) ($package->display_name ?? '')) === Str::lower((string) $servicePlan));
    }

    private function resolveImportProduct(array $row, array $preview, string $tenantId, int $index): Product
    {
        $productId = $row['product_id']
            ?? Arr::get($preview, 'suggested_product.id');

        if (! $productId) {
            throw ValidationException::withMessages([
                "imports.{$index}.product_id" => ['Select a product before importing this subscription.'],
            ]);
        }

        $product = $this->products->findByIdForDisplay((string) $productId);

        if (! $product || $product->tenant_id !== $tenantId) {
            throw ValidationException::withMessages([
                "imports.{$index}.product_id" => ['The selected product is invalid for the current tenant.'],
            ]);
        }

        return $product;
    }

    private function resolveImportClient(array $row, array $preview, Tenant $tenant, User $actor, int $index): Client
    {
        $clientId = $row['client_id'] ?? null;

        if ($clientId) {
            $client = $this->clients->findById((string) $clientId);

            if (! $client || $client->tenant_id !== $tenant->id) {
                throw ValidationException::withMessages([
                    "imports.{$index}.client_id" => ['The selected client is invalid for the current tenant.'],
                ]);
            }

            return $client;
        }

        if (Arr::get($preview, 'matched_client.id')) {
            return Client::query()->findOrFail(Arr::get($preview, 'matched_client.id'));
        }

        $email = Str::lower(trim((string) ($row['client']['email'] ?? $preview['email'] ?? '')));

        if ($email === '') {
            throw ValidationException::withMessages([
                "imports.{$index}.client.email" => ['An email address is required when importing to a new client record.'],
            ]);
        }

        $existing = $this->findMatchedClient($tenant->id, $email);

        if ($existing) {
            return $existing;
        }

        $this->licenseService->enforceClientLimitForTenant($tenant->id, Client::STATUS_ACTIVE);

        $companyName = trim((string) ($row['client']['company_name'] ?? $preview['owner_name'] ?? $preview['domain']));
        $firstName = trim((string) ($row['client']['first_name'] ?? ''));
        $lastName = trim((string) ($row['client']['last_name'] ?? ''));
        $clientType = $companyName !== '' ? Client::TYPE_COMPANY : Client::TYPE_INDIVIDUAL;

        $client = $this->clients->create([
            'tenant_id' => $tenant->id,
            'user_id' => null,
            'client_type' => $clientType,
            'first_name' => $firstName !== '' ? $firstName : null,
            'last_name' => $lastName !== '' ? $lastName : null,
            'company_name' => $companyName !== '' ? $companyName : null,
            'email' => $email,
            'phone' => $row['client']['phone'] ?? null,
            'country' => Str::upper((string) ($row['client']['country'] ?? 'US')),
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => Str::upper((string) ($tenant->default_currency ?: config('hostinvo.default_currency', 'USD'))),
            'notes' => sprintf('Imported automatically from Plesk subscription %s.', $preview['subscription_name']),
        ]);

        $this->clients->logActivity($client, [
            'user_id' => $actor->id,
            'action' => 'client.imported_from_plesk',
            'description' => 'Client record created from a Plesk subscription import.',
            'metadata' => [
                'subscription_name' => $preview['subscription_name'],
            ],
        ]);

        return $client;
    }

    private function createImportedService(
        Server $server,
        Tenant $tenant,
        Product $product,
        Client $client,
        array $preview,
        array $row,
        User $actor,
    ): Service {
        $serverPackageId = $this->resolveServerPackageId($product, $preview);
        [$price, $currency, $billingCycle] = $this->resolveImportedPricing($product, (string) ($row['billing_cycle'] ?? ProductPricing::CYCLE_MONTHLY), $tenant);
        $service = $this->services->create([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'product_id' => $product->id,
            'order_id' => null,
            'order_item_id' => null,
            'user_id' => $actor->id,
            'server_id' => $server->id,
            'server_package_id' => $serverPackageId,
            'reference_number' => $this->generateReferenceNumber(),
            'service_type' => Service::TYPE_HOSTING,
            'status' => $preview['status'],
            'provisioning_state' => Service::PROVISIONING_SYNCED,
            'billing_cycle' => $billingCycle,
            'price' => $price,
            'currency' => $currency,
            'domain' => $preview['domain'],
            'username' => $preview['username'],
            'registration_date' => now()->toDateString(),
            'next_due_date' => null,
            'termination_date' => null,
            'external_reference' => $preview['subscription_name'],
            'last_operation' => 'import_existing',
            'activated_at' => in_array($preview['status'], [Service::STATUS_ACTIVE, Service::STATUS_SUSPENDED], true) ? now() : null,
            'suspended_at' => $preview['status'] === Service::STATUS_SUSPENDED ? now() : null,
            'terminated_at' => $preview['status'] === Service::STATUS_TERMINATED ? now() : null,
            'last_synced_at' => now(),
            'notes' => $row['notes'] ?? null,
            'metadata' => [
                'import' => [
                    'source' => 'plesk',
                    'subscription_name' => $preview['subscription_name'],
                    'imported_at' => now()->toIso8601String(),
                    'imported_by_user_id' => $actor->id,
                ],
                'panel' => [
                    'service_plan' => $preview['service_plan'],
                    'raw_status' => $preview['raw_status'],
                ],
                'remote' => $preview['raw_info'],
            ],
        ]);

        $service->usage()->updateOrCreate(
            ['service_id' => $service->id],
            [
                'tenant_id' => $service->tenant_id,
                'disk_used_mb' => $preview['disk_used_mb'] ?? 0,
                'disk_limit_mb' => $preview['disk_limit_mb'] ?? 0,
                'bandwidth_used_mb' => $preview['bandwidth_used_mb'] ?? 0,
                'bandwidth_limit_mb' => $preview['bandwidth_limit_mb'] ?? 0,
                'inodes_used' => 0,
                'email_accounts_used' => $preview['email_accounts_used'] ?? 0,
                'databases_used' => $preview['databases_used'] ?? 0,
                'last_synced_at' => now(),
                'metadata' => [
                    'driver' => $server->panel_type,
                    'source' => 'plesk_import',
                ],
            ]
        );

        $credential = new ServiceCredential();
        $credential->forceFill([
            'tenant_id' => $service->tenant_id,
            'service_id' => $service->id,
            'key' => 'primary',
            'credentials' => array_filter([
                'username' => $preview['username'],
            ], static fn (mixed $value): bool => filled($value)),
            'control_panel_url' => $server->api_endpoint,
            'access_url' => filled($preview['domain']) ? sprintf('https://%s', $preview['domain']) : null,
            'metadata' => [
                'driver' => $server->panel_type,
                'source' => 'plesk_import',
            ],
        ]);
        $credential->save();

        if ($preview['status'] === Service::STATUS_SUSPENDED) {
            $service->suspensions()->create([
                'tenant_id' => $service->tenant_id,
                'user_id' => null,
                'reason' => 'Imported from a suspended Plesk subscription.',
                'suspended_at' => now(),
                'metadata' => [
                    'driver' => $server->panel_type,
                    'source' => 'plesk_import',
                ],
            ]);
        }

        $this->logger->recordServiceNote(
            $service,
            'Imported from an existing Plesk subscription.',
            [
                'subscription_name' => $preview['subscription_name'],
                'service_plan' => $preview['service_plan'],
                'status' => $preview['status'],
            ],
        );

        return $this->services->findByIdForDisplay($service->id) ?? $service;
    }

    private function resolveServerPackageId(Product $product, array $preview): ?int
    {
        $serverPackageId = Arr::get($preview, 'suggested_server_package.id');

        if ($serverPackageId) {
            return (int) $serverPackageId;
        }

        $package = ServerPackage::query()
            ->where('tenant_id', $product->tenant_id)
            ->where('product_id', $product->id)
            ->when(filled($preview['service_plan'] ?? null), function ($query) use ($preview): void {
                $query->where(function ($packageQuery) use ($preview): void {
                    $packageQuery
                        ->where('panel_package_name', $preview['service_plan'])
                        ->orWhere('display_name', $preview['service_plan']);
                });
            })
            ->first();

        return $package?->id;
    }

    private function resolveImportedPricing(Product $product, string $billingCycle, Tenant $tenant): array
    {
        $pricing = $product->pricing()
            ->where('billing_cycle', $billingCycle)
            ->where('is_enabled', true)
            ->first();

        if ($pricing) {
            return [
                (int) $pricing->getRawOriginal('price'),
                Str::upper((string) $pricing->currency),
                $billingCycle,
            ];
        }

        $fallback = $product->pricing()
            ->where('is_enabled', true)
            ->orderBy('price')
            ->first();

        if ($fallback) {
            return [
                (int) $fallback->getRawOriginal('price'),
                Str::upper((string) $fallback->currency),
                (string) $fallback->billing_cycle,
            ];
        }

        return [
            0,
            Str::upper((string) ($tenant->default_currency ?: config('hostinvo.default_currency', 'USD'))),
            ProductPricing::CYCLE_MONTHLY,
        ];
    }

    private function mapServiceStatus(string $status): string
    {
        $normalized = Str::lower($status);

        return match (true) {
            Str::contains($normalized, 'suspend'),
            Str::contains($normalized, 'disable') => Service::STATUS_SUSPENDED,
            Str::contains($normalized, 'terminate'),
            Str::contains($normalized, 'remove') => Service::STATUS_TERMINATED,
            Str::contains($normalized, 'fail'),
            Str::contains($normalized, 'error') => Service::STATUS_FAILED,
            default => Service::STATUS_ACTIVE,
        };
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

    private function toMegabytes(?string $value): int
    {
        if ($value === null || $value === '') {
            return 0;
        }

        if (is_numeric($value)) {
            return max(0, (int) round((float) $value));
        }

        if (! preg_match('/([\d.]+)\s*([a-zA-Z]*)/', trim($value), $matches)) {
            return 0;
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

    private function generateReferenceNumber(): string
    {
        return 'SVC-'.now()->format('YmdHis').'-'.Str::upper(Str::random(6));
    }
}
