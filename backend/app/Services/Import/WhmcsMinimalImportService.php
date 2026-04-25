<?php

namespace App\Services\Import;

use App\Models\Client;
use App\Models\ClientAddress;
use App\Models\Product;
use App\Models\ProductGroup;
use App\Models\ProductPricing;
use App\Models\Role;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class WhmcsMinimalImportService
{
    /**
     * @param array{
     *     host:string,
     *     port?:int|string|null,
     *     database:string,
     *     username:string,
     *     password?:string|null,
     *     charset?:string|null,
     *     table_prefix?:string|null
     * } $credentials
     */
    public function importFromCredentials(Tenant $tenant, array $credentials): array
    {
        foreach (['host', 'database', 'username'] as $key) {
            if (blank($credentials[$key] ?? null)) {
                throw new RuntimeException(sprintf('Missing WHMCS database credential: %s.', $key));
            }
        }

        $connection = 'whmcs_import_'.Str::lower(Str::random(10));

        config()->set("database.connections.{$connection}", [
            'driver' => 'mysql',
            'host' => $credentials['host'],
            'port' => (int) ($credentials['port'] ?? 3306),
            'database' => $credentials['database'],
            'username' => $credentials['username'],
            'password' => (string) ($credentials['password'] ?? ''),
            'charset' => (string) ($credentials['charset'] ?? 'utf8mb4'),
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => false,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                \PDO::MYSQL_ATTR_SSL_CA => $credentials['ssl_ca'] ?? null,
            ]) : [],
        ]);

        DB::purge($connection);

        try {
            return $this->import($tenant, $connection, (string) ($credentials['table_prefix'] ?? 'tbl'));
        } finally {
            DB::disconnect($connection);
            config()->set("database.connections.{$connection}", null);
        }
    }

    public function import(Tenant $tenant, string $sourceConnection, string $tablePrefix = 'tbl'): array
    {
        $source = DB::connection($sourceConnection);
        $prefix = $tablePrefix !== '' ? $tablePrefix : 'tbl';

        $this->assertRequiredTablesExist($source, $prefix);

        $sourceClients = $this->fetchRows($source, $this->table($prefix, 'clients'));
        $sourceGroups = $this->fetchRows($source, $this->table($prefix, 'productgroups'));
        $sourceProducts = $this->fetchRows($source, $this->table($prefix, 'products'));
        $sourceServices = $this->fetchRows($source, $this->table($prefix, 'hosting'));

        $summary = [
            'clients' => ['created' => 0, 'updated' => 0],
            'product_groups' => ['created' => 0, 'updated' => 0],
            'products' => ['created' => 0, 'updated' => 0, 'placeholder_created' => 0, 'default_pricing_created' => 0],
            'services' => ['created' => 0, 'updated' => 0, 'skipped' => 0],
            'missing_relations' => [],
        ];

        DB::transaction(function () use ($tenant, $sourceClients, $sourceGroups, $sourceProducts, $sourceServices, &$summary): void {
            $clientMap = $this->importClients($tenant, $sourceClients, $summary);
            $groupMap = $this->importProductGroups($tenant, $sourceGroups, $summary);
            $productMap = $this->importProducts($tenant, $sourceProducts, $groupMap, $summary);
            $this->importServices($tenant, $sourceServices, $clientMap, $productMap, $summary);
        });

        $summary['missing_relations'] = array_values(array_unique($summary['missing_relations']));

        return $summary;
    }

    private function assertRequiredTablesExist(ConnectionInterface $source, string $prefix): void
    {
        foreach (['clients', 'productgroups', 'products', 'hosting'] as $table) {
            $tableName = $this->table($prefix, $table);

            if (! $source->getSchemaBuilder()->hasTable($tableName)) {
                throw new RuntimeException(sprintf('WHMCS source table "%s" was not found.', $tableName));
            }
        }
    }

    private function fetchRows(ConnectionInterface $source, string $table): Collection
    {
        return $source->table($table)->orderBy('id')->get()->map(fn (object $row): array => (array) $row);
    }

    private function importClients(Tenant $tenant, Collection $rows, array &$summary): array
    {
        $map = [];

        foreach ($rows as $row) {
            $sourceId = (int) ($row['id'] ?? 0);
            $email = Str::lower(trim((string) ($row['email'] ?? '')));

            if ($sourceId <= 0 || $email === '') {
                $summary['missing_relations'][] = sprintf('Client #%d skipped because email is missing.', $sourceId);
                continue;
            }

            $client = Client::query()
                ->where('tenant_id', $tenant->id)
                ->whereRaw('LOWER(email) = ?', [$email])
                ->first();

            $attributes = [
                'tenant_id' => $tenant->id,
                'client_type' => filled($row['companyname'] ?? null) ? Client::TYPE_COMPANY : Client::TYPE_INDIVIDUAL,
                'first_name' => $this->nullableString($row['firstname'] ?? null),
                'last_name' => $this->nullableString($row['lastname'] ?? null),
                'company_name' => $this->nullableString($row['companyname'] ?? null),
                'email' => $email,
                'phone' => $this->nullableString($row['phonenumber'] ?? $row['phone'] ?? null),
                'country' => $this->normalizeCountry($row['country'] ?? null),
                'status' => Client::STATUS_ACTIVE,
                'preferred_locale' => $tenant->default_locale ?: 'en',
                'currency' => Str::upper((string) ($tenant->default_currency ?: config('hostinvo.default_currency', 'USD'))),
                'notes' => $this->appendImportNote((string) ($client?->notes ?? ''), 'whmcs_client_id', (string) $sourceId),
            ];

            if ($client) {
                $client->forceFill($attributes)->save();
                $summary['clients']['updated']++;
            } else {
                $client = new Client();
                $client->forceFill($attributes)->save();
                $summary['clients']['created']++;
            }

            $this->syncBillingAddress($client, $row);
            $this->syncClientPortalUser($client, $tenant);

            $map[$sourceId] = $client->id;
        }

        return $map;
    }

    private function importProductGroups(Tenant $tenant, Collection $rows, array &$summary): array
    {
        $map = [];

        foreach ($rows as $row) {
            $sourceId = (int) ($row['id'] ?? 0);
            $name = trim((string) ($row['name'] ?? ''));

            if ($sourceId <= 0 || $name === '') {
                $summary['missing_relations'][] = sprintf('Product group #%d skipped because name is missing.', $sourceId);
                continue;
            }

            $group = ProductGroup::query()
                ->where('tenant_id', $tenant->id)
                ->where('slug', $this->sourceSlug('whmcs-group', $sourceId, $name))
                ->first();

            $attributes = [
                'tenant_id' => $tenant->id,
                'name' => $name,
                'slug' => $this->sourceSlug('whmcs-group', $sourceId, $name),
                'description' => $this->nullableString($row['headline'] ?? $row['tagline'] ?? null),
                'status' => ProductGroup::STATUS_ACTIVE,
                'visibility' => ProductGroup::VISIBILITY_PUBLIC,
                'display_order' => (int) ($row['order'] ?? $row['orderfrmtpl'] ?? 0),
                'sort_order' => (int) ($row['order'] ?? 0),
            ];

            if ($group) {
                $group->fill($attributes)->save();
                $summary['product_groups']['updated']++;
            } else {
                $group = ProductGroup::query()->create($attributes);
                $summary['product_groups']['created']++;
            }

            $map[$sourceId] = (int) $group->id;
        }

        return $map;
    }

    private function importProducts(Tenant $tenant, Collection $rows, array $groupMap, array &$summary): array
    {
        $map = [];

        foreach ($rows as $row) {
            $sourceId = (int) ($row['id'] ?? 0);
            $name = trim((string) ($row['name'] ?? ''));

            if ($sourceId <= 0 || $name === '') {
                $summary['missing_relations'][] = sprintf('Product #%d skipped because name is missing.', $sourceId);
                continue;
            }

            $groupId = (int) ($row['gid'] ?? 0);
            $product = $this->upsertProduct(
                tenant: $tenant,
                sourceId: $sourceId,
                name: $name,
                description: $this->nullableString($row['description'] ?? null),
                groupId: $groupId > 0 ? ($groupMap[$groupId] ?? null) : null,
                row: $row,
                summary: $summary,
            );

            if ($groupId > 0 && ! isset($groupMap[$groupId])) {
                $summary['missing_relations'][] = sprintf('Product #%d referenced missing product group #%d.', $sourceId, $groupId);
            }

            $map[$sourceId] = $product->id;
        }

        return $map;
    }

    private function importServices(Tenant $tenant, Collection $rows, array $clientMap, array $productMap, array &$summary): void
    {
        foreach ($rows as $row) {
            $sourceId = (int) ($row['id'] ?? 0);
            $sourceClientId = (int) ($row['userid'] ?? $row['client_id'] ?? 0);
            $sourceProductId = (int) ($row['packageid'] ?? 0);
            $clientId = $clientMap[$sourceClientId] ?? null;

            if ($sourceId <= 0 || ! $clientId) {
                $summary['services']['skipped']++;
                $summary['missing_relations'][] = sprintf('Service #%d skipped because client #%d was not imported.', $sourceId, $sourceClientId);
                continue;
            }

            $productId = $productMap[$sourceProductId] ?? null;

            if (! $productId) {
                $product = $this->createPlaceholderProduct($tenant, $sourceProductId, $summary);
                $productId = $product->id;
                $productMap[$sourceProductId] = $productId;
                $summary['missing_relations'][] = sprintf('Service #%d referenced missing product #%d; placeholder product created.', $sourceId, $sourceProductId);
            }

            $client = Client::query()->where('tenant_id', $tenant->id)->findOrFail($clientId);
            $product = Product::query()->where('tenant_id', $tenant->id)->findOrFail($productId);
            $service = Service::query()
                ->where('tenant_id', $tenant->id)
                ->where('external_reference', $this->serviceExternalReference($sourceId))
                ->first();

            $status = $this->mapServiceStatus((string) ($row['domainstatus'] ?? ''));
            $registrationDate = $this->normalizeDate($row['regdate'] ?? null);
            $nextDueDate = $this->normalizeDate($row['nextduedate'] ?? null);

            $attributes = [
                'tenant_id' => $tenant->id,
                'client_id' => $client->id,
                'product_id' => $product->id,
                'user_id' => $client->user_id,
                'server_id' => $product->server_id,
                'reference_number' => $service?->reference_number ?: $this->generateReferenceNumber($sourceId),
                'service_type' => Service::TYPE_HOSTING,
                'status' => $status,
                'provisioning_state' => Service::PROVISIONING_SYNCED,
                'billing_cycle' => $this->mapBillingCycle((string) ($row['billingcycle'] ?? '')),
                'price' => 0,
                'currency' => Str::upper((string) ($tenant->default_currency ?: config('hostinvo.default_currency', 'USD'))),
                'domain' => $this->nullableString($row['domain'] ?? null),
                'username' => $this->nullableString($row['username'] ?? null),
                'registration_date' => $registrationDate,
                'next_due_date' => $nextDueDate,
                'termination_date' => $status === Service::STATUS_TERMINATED ? $this->normalizeDate($row['termination_date'] ?? null) : null,
                'external_reference' => $this->serviceExternalReference($sourceId),
                'last_operation' => 'whmcs_import',
                'activated_at' => in_array($status, [Service::STATUS_ACTIVE, Service::STATUS_SUSPENDED], true) ? now() : null,
                'suspended_at' => $status === Service::STATUS_SUSPENDED ? now() : null,
                'terminated_at' => $status === Service::STATUS_TERMINATED ? now() : null,
                'last_synced_at' => now(),
                'notes' => $this->nullableString($row['notes'] ?? null),
                'metadata' => [
                    'import' => [
                        'source' => 'whmcs',
                        'hosting_id' => $sourceId,
                        'client_id' => $sourceClientId,
                        'package_id' => $sourceProductId,
                        'imported_at' => now()->toIso8601String(),
                    ],
                    'whmcs' => [
                        'billingcycle' => $row['billingcycle'] ?? null,
                        'domainstatus' => $row['domainstatus'] ?? null,
                    ],
                ],
            ];

            if ($service) {
                $service->forceFill($attributes)->save();
                $summary['services']['updated']++;
            } else {
                $service = new Service();
                $service->forceFill($attributes)->save();
                $summary['services']['created']++;
            }
        }
    }

    private function syncBillingAddress(Client $client, array $row): void
    {
        $line1 = $this->nullableString($row['address1'] ?? $row['address'] ?? null);
        $line2 = $this->nullableString($row['address2'] ?? null);
        $city = $this->nullableString($row['city'] ?? null);
        $state = $this->nullableString($row['state'] ?? null);
        $postalCode = $this->nullableString($row['postcode'] ?? $row['postalcode'] ?? null);

        if (! $line1 && ! $line2 && ! $city && ! $state && ! $postalCode) {
            return;
        }

        ClientAddress::query()->updateOrCreate(
            [
                'tenant_id' => $client->tenant_id,
                'client_id' => $client->id,
                'type' => ClientAddress::TYPE_BILLING,
            ],
            [
                'line_1' => $line1 ?: 'Imported WHMCS address',
                'line_2' => $line2,
                'city' => $city ?: '-',
                'state' => $state,
                'postal_code' => $postalCode,
                'country' => $this->normalizeCountry($row['country'] ?? null),
                'is_primary' => true,
            ],
        );
    }

    private function syncClientPortalUser(Client $client, Tenant $tenant): void
    {
        $role = Role::query()->where('name', Role::CLIENT_USER)->first();
        $name = trim((string) $client->display_name) ?: $client->email;

        $user = User::query()
            ->where('tenant_id', $tenant->id)
            ->whereRaw('LOWER(email) = ?', [Str::lower($client->email)])
            ->first();

        $isNewUser = ! $user;
        $user ??= new User();

        $attributes = [
            'tenant_id' => $tenant->id,
            'name' => $name,
            'email' => Str::lower($client->email),
            'locale' => $tenant->default_locale ?: 'en',
            'is_active' => true,
            'email_verification_required' => true,
            'requires_password_reset' => true,
        ];

        if ($isNewUser) {
            $attributes['password'] = null;
        }

        $user->forceFill($attributes)->save();

        if ($role) {
            $user->roles()->syncWithoutDetaching([$role->id]);
        }

        $tenantUser = TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->first() ?? new TenantUser();

        $tenantUser->forceFill([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role_id' => $role?->id,
            'is_primary' => true,
            'joined_at' => now(),
        ])->save();

        if ($client->user_id !== $user->id) {
            $client->forceFill(['user_id' => $user->id])->save();
        }
    }

    private function upsertProduct(
        Tenant $tenant,
        int $sourceId,
        string $name,
        ?string $description,
        ?int $groupId,
        array $row,
        array &$summary,
    ): Product {
        $product = Product::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', $this->sourceSlug('whmcs-product', $sourceId, $name))
            ->first();

        $attributes = [
            'tenant_id' => $tenant->id,
            'product_group_id' => $groupId,
            'type' => Product::TYPE_HOSTING,
            'provisioning_module' => $this->mapProvisioningModule($row['servertype'] ?? null),
            'provisioning_package' => $this->nullableString($row['configoption1'] ?? null),
            'name' => $name,
            'slug' => $this->sourceSlug('whmcs-product', $sourceId, $name),
            'summary' => null,
            'description' => $description,
            'status' => Product::STATUS_ACTIVE,
            'visibility' => $this->truthy($row['hidden'] ?? null) ? Product::VISIBILITY_HIDDEN : Product::VISIBILITY_PUBLIC,
            'display_order' => (int) ($row['order'] ?? 0),
            'is_featured' => false,
            'require_domain' => true,
            'apply_tax' => true,
            'payment_type' => Product::PAYMENT_TYPE_RECURRING,
            'allow_multiple_quantities' => Product::MULTIPLE_QUANTITIES_NO,
        ];

        if ($product) {
            $product->forceFill($attributes)->save();
            $summary['products']['updated']++;
        } else {
            $product = new Product();
            $product->forceFill($attributes)->save();
            $summary['products']['created']++;
        }

        $this->ensureDefaultPricing($product, $tenant, $summary);

        return $product;
    }

    private function createPlaceholderProduct(Tenant $tenant, int $sourceId, array &$summary): Product
    {
        $name = sprintf('Migrated Product #%d', $sourceId);

        $product = Product::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', $this->sourceSlug('whmcs-product', $sourceId, $name))
            ->first();

        if (! $product) {
            $product = new Product();
            $product->forceFill([
                'tenant_id' => $tenant->id,
                'type' => Product::TYPE_HOSTING,
                'name' => $name,
                'slug' => $this->sourceSlug('whmcs-product', $sourceId, $name),
                'description' => 'Placeholder product created during WHMCS minimal import.',
                'status' => Product::STATUS_ACTIVE,
                'visibility' => Product::VISIBILITY_HIDDEN,
                'display_order' => 0,
                'is_featured' => false,
                'require_domain' => true,
                'apply_tax' => true,
                'payment_type' => Product::PAYMENT_TYPE_RECURRING,
                'allow_multiple_quantities' => Product::MULTIPLE_QUANTITIES_NO,
            ])->save();
            $summary['products']['placeholder_created']++;
        }

        $this->ensureDefaultPricing($product, $tenant, $summary);

        return $product;
    }

    private function ensureDefaultPricing(Product $product, Tenant $tenant, array &$summary): void
    {
        $hasPricing = ProductPricing::query()
            ->where('tenant_id', $tenant->id)
            ->where('product_id', $product->id)
            ->exists();

        if ($hasPricing) {
            return;
        }

        ProductPricing::query()->create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
            'currency' => Str::upper((string) ($tenant->default_currency ?: config('hostinvo.default_currency', 'USD'))),
            'price' => 0,
            'setup_fee' => 0,
            'is_enabled' => true,
        ]);

        $summary['products']['default_pricing_created']++;
    }

    private function mapServiceStatus(string $status): string
    {
        $normalized = Str::lower(trim($status));

        return match ($normalized) {
            'active' => Service::STATUS_ACTIVE,
            'suspended' => Service::STATUS_SUSPENDED,
            'terminated', 'cancelled', 'canceled', 'fraud' => Service::STATUS_TERMINATED,
            default => Service::STATUS_PENDING,
        };
    }

    private function mapBillingCycle(string $cycle): string
    {
        $normalized = Str::of($cycle)->lower()->replace([' ', '-'], '')->toString();

        return match ($normalized) {
            'quarterly' => ProductPricing::CYCLE_QUARTERLY,
            'semiannually', 'semiannual' => ProductPricing::CYCLE_SEMIANNUALLY,
            'annually', 'annual', 'yearly' => ProductPricing::CYCLE_ANNUALLY,
            'biennially', 'biennial' => ProductPricing::CYCLE_BIENNIALLY,
            'triennially', 'triennial' => ProductPricing::CYCLE_TRIENNIALLY,
            default => ProductPricing::CYCLE_MONTHLY,
        };
    }

    private function mapProvisioningModule(mixed $value): ?string
    {
        $module = Str::lower(trim((string) $value));

        return in_array($module, Product::provisioningModules(), true) ? $module : null;
    }

    private function normalizeDate(mixed $value): ?string
    {
        $date = trim((string) $value);

        if ($date === '' || $date === '0000-00-00' || $date === '0000-00-00 00:00:00') {
            return null;
        }

        return Str::substr($date, 0, 10);
    }

    private function normalizeCountry(mixed $value): string
    {
        $country = Str::upper(trim((string) $value));

        return preg_match('/^[A-Z]{2}$/', $country) ? $country : 'US';
    }

    private function nullableString(mixed $value): ?string
    {
        $normalized = trim((string) $value);

        return $normalized === '' ? null : $normalized;
    }

    private function truthy(mixed $value): bool
    {
        return in_array(Str::lower(trim((string) $value)), ['1', 'true', 'yes', 'on'], true);
    }

    private function sourceSlug(string $prefix, int $sourceId, string $name): string
    {
        $suffix = Str::slug($name);

        return $suffix !== '' ? "{$prefix}-{$sourceId}-{$suffix}" : "{$prefix}-{$sourceId}";
    }

    private function serviceExternalReference(int $sourceId): string
    {
        return "whmcs-hosting:{$sourceId}";
    }

    private function generateReferenceNumber(int $sourceId): string
    {
        return sprintf('WHMCS-%d-%s', $sourceId, Str::upper(Str::random(6)));
    }

    private function appendImportNote(string $existingNotes, string $key, string $value): string
    {
        $line = sprintf('%s: %s', $key, $value);

        if (Str::contains($existingNotes, $line)) {
            return $existingNotes;
        }

        return trim($existingNotes."\n".$line);
    }

    private function table(string $prefix, string $name): string
    {
        return "{$prefix}{$name}";
    }
}
