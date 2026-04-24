<?php

namespace Tests\Feature\Provisioning;

use App\Models\Client;
use App\Models\License;
use App\Models\Product;
use App\Models\ProductPricing;
use App\Models\Role;
use App\Models\Server;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PleskImportApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_can_preview_existing_plesk_subscriptions_for_import(): void
    {
        [$tenant, $user, $server, $product, $client] = $this->createImportContext();

        $server->packages()->create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'panel_package_name' => 'Plesk Shared Basic',
            'display_name' => 'Plesk Shared Basic',
            'is_default' => true,
        ]);

        Service::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'product_id' => $product->id,
            'server_id' => $server->id,
            'reference_number' => 'SVC-IMPORTED-1',
            'service_type' => Service::TYPE_HOSTING,
            'status' => Service::STATUS_ACTIVE,
            'provisioning_state' => Service::PROVISIONING_SYNCED,
            'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
            'price' => 1500,
            'currency' => 'USD',
            'domain' => 'existing.example.test',
            'username' => 'existinguser',
            'external_reference' => 'existing.example.test',
        ]);

        Sanctum::actingAs($user);

        Http::fake(function (Request $request) {
            $this->assertTrue(
                $request->hasHeader('Authorization', 'Basic '.base64_encode('admin:plesk-import-key'))
            );

            $payload = json_decode($request->body(), true);
            $params = $payload['params'] ?? [];

            return match ($params[0] ?? null) {
                '--list' => Http::response([
                    'code' => 0,
                    'stdout' => implode("\n", [
                        'existing.example.test',
                        'new.example.test',
                    ]),
                    'stderr' => '',
                ], 200),
                '--info' => Http::response([
                    'code' => 0,
                    'stdout' => match ($params[1] ?? '') {
                        'existing.example.test' => implode("\n", [
                            'Subscription: existing.example.test',
                            'System user: existinguser',
                            'Service plan: Plesk Shared Basic',
                            'Status: Active',
                            'Contact email: import-client@example.test',
                            'Customer name: Import Client',
                            'Disk space: 1024 MB',
                            'Hard disk quota: 2048 MB',
                            'Traffic: 512 MB',
                            'Traffic limit: 4096 MB',
                            'Mailboxes: 2',
                            'Databases: 1',
                        ]),
                        default => implode("\n", [
                            'Subscription: new.example.test',
                            'System user: newuser',
                            'Service plan: Plesk Shared Basic',
                            'Status: Suspended',
                            'Contact email: new-client@example.test',
                            'Customer name: New Imported Client',
                            'Disk space: 2048 MB',
                            'Hard disk quota: 4096 MB',
                            'Traffic: 1024 MB',
                            'Traffic limit: 8192 MB',
                            'Mailboxes: 3',
                            'Databases: 2',
                        ]),
                    },
                    'stderr' => '',
                ], 200),
                default => Http::response(['code' => 1, 'stderr' => 'Unsupported command'], 200),
            };
        });

        $this->getJson("/api/v1/admin/servers/{$server->id}/imports/plesk-subscriptions")
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.already_imported', 1)
            ->assertJsonPath('data.0.subscription_name', 'existing.example.test')
            ->assertJsonPath('data.0.existing_service.reference_number', 'SVC-IMPORTED-1')
            ->assertJsonPath('data.0.matched_client.email', 'import-client@example.test')
            ->assertJsonPath('data.0.suggested_product.id', $product->id)
            ->assertJsonPath('data.1.subscription_name', 'new.example.test')
            ->assertJsonPath('data.1.status', Service::STATUS_SUSPENDED);
    }

    public function test_tenant_admin_can_import_existing_plesk_subscriptions_as_local_services(): void
    {
        [$tenant, $user, $server, $product] = $this->createImportContext(withExistingClient: false);

        $server->packages()->create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'panel_package_name' => 'Plesk Shared Basic',
            'display_name' => 'Plesk Shared Basic',
            'is_default' => true,
        ]);

        $product->pricing()->create([
            'tenant_id' => $tenant->id,
            'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
            'currency' => 'USD',
            'price' => '14.99',
            'setup_fee' => '0.00',
            'is_enabled' => true,
        ]);

        Sanctum::actingAs($user);

        Http::fake(function (Request $request) {
            $this->assertTrue(
                $request->hasHeader('Authorization', 'Basic '.base64_encode('admin:plesk-import-key'))
            );
            $this->assertFalse($request->hasHeader('X-API-Key'));

            $payload = json_decode($request->body(), true);
            $params = $payload['params'] ?? [];

            return match ($params[0] ?? null) {
                '--info' => Http::response([
                    'code' => 0,
                    'stdout' => implode("\n", [
                        'Subscription: imported.example.test',
                        'System user: importeduser',
                        'Service plan: Plesk Shared Basic',
                        'Status: Active',
                        'Contact email: imported-client@example.test',
                        'Customer name: Imported Client LLC',
                        'Disk space: 3072 MB',
                        'Hard disk quota: 10240 MB',
                        'Traffic: 1536 MB',
                        'Traffic limit: 20480 MB',
                        'Mailboxes: 5',
                        'Databases: 4',
                    ]),
                    'stderr' => '',
                ], 200),
                default => Http::response(['code' => 1, 'stderr' => 'Unsupported command'], 200),
            };
        });

        $response = $this->postJson("/api/v1/admin/servers/{$server->id}/imports/plesk-subscriptions", [
            'imports' => [
                [
                    'subscription_name' => 'imported.example.test',
                ],
            ],
        ]);

        $serviceId = $response->json('data.imported.0.id');
        $clientId = $response->json('data.imported.0.client.id');

        $response
            ->assertCreated()
            ->assertJsonPath('data.summary.services_created', 1)
            ->assertJsonPath('data.summary.clients_created', 1)
            ->assertJsonPath('data.imported.0.external_reference', 'imported.example.test')
            ->assertJsonPath('data.imported.0.domain', 'imported.example.test')
            ->assertJsonPath('data.imported.0.username', 'importeduser')
            ->assertJsonPath('data.imported.0.status', Service::STATUS_ACTIVE)
            ->assertJsonPath('data.imported.0.provisioning_state', Service::PROVISIONING_SYNCED)
            ->assertJsonPath('data.imported.0.server_package.display_name', 'Plesk Shared Basic');

        $this->assertDatabaseHas('clients', [
            'id' => $clientId,
            'tenant_id' => $tenant->id,
            'company_name' => 'Imported Client LLC',
            'email' => 'imported-client@example.test',
            'status' => Client::STATUS_ACTIVE,
        ]);

        $this->assertDatabaseHas('services', [
            'id' => $serviceId,
            'tenant_id' => $tenant->id,
            'client_id' => $clientId,
            'product_id' => $product->id,
            'server_id' => $server->id,
            'status' => Service::STATUS_ACTIVE,
            'provisioning_state' => Service::PROVISIONING_SYNCED,
            'domain' => 'imported.example.test',
            'username' => 'importeduser',
            'external_reference' => 'imported.example.test',
            'price' => 1499,
            'currency' => 'USD',
        ]);

        $this->assertDatabaseHas('service_usage', [
            'service_id' => $serviceId,
            'disk_used_mb' => 3072,
            'disk_limit_mb' => 10240,
            'bandwidth_used_mb' => 1536,
            'bandwidth_limit_mb' => 20480,
            'email_accounts_used' => 5,
            'databases_used' => 4,
        ]);

        $this->assertDatabaseHas('service_credentials', [
            'service_id' => $serviceId,
            'control_panel_url' => 'https://192.0.2.50:8443',
            'access_url' => 'https://imported.example.test',
        ]);

        $this->assertSame(1, $server->fresh()->current_accounts);
    }

    public function test_tenant_admin_can_create_product_inline_when_importing_custom_plesk_subscription(): void
    {
        [$tenant, $user, $server] = $this->createImportContext(withExistingClient: false);

        Sanctum::actingAs($user);

        Http::fake(function (Request $request) {
            $payload = json_decode($request->body(), true);
            $params = $payload['params'] ?? [];

            return match ($params[0] ?? null) {
                '--info' => Http::response([
                    'code' => 0,
                    'stdout' => implode("\n", [
                        'Subscription: canadian-mcsa.com',
                        'Status: Active',
                        'Contact email: billing@canadian-mcsa.com',
                        'Customer name: Canadian MCSA',
                        'Disk space: 498 MB',
                        'Hard disk quota: Unlimited (not supported)',
                        'Traffic: 0 B/Month',
                        'Traffic limit: 70.0 GB',
                    ]),
                    'stderr' => '',
                ], 200),
                default => Http::response(['code' => 1, 'stderr' => 'Unsupported command'], 200),
            };
        });

        $response = $this->postJson("/api/v1/admin/servers/{$server->id}/imports/plesk-subscriptions", [
            'imports' => [
                [
                    'subscription_name' => 'canadian-mcsa.com',
                    'product' => [
                        'name' => 'Canadian MCSA Hosting',
                    ],
                ],
            ],
        ]);

        $productId = $response->json('data.imported.0.product.id');
        $serviceId = $response->json('data.imported.0.id');

        $response
            ->assertCreated()
            ->assertJsonPath('data.imported.0.domain', 'canadian-mcsa.com')
            ->assertJsonPath('data.imported.0.product.name', 'Canadian MCSA Hosting');

        $this->assertDatabaseHas('products', [
            'id' => $productId,
            'tenant_id' => $tenant->id,
            'server_id' => $server->id,
            'name' => 'Canadian MCSA Hosting',
            'provisioning_module' => Product::MODULE_PLESK,
            'provisioning_package' => null,
            'visibility' => Product::VISIBILITY_HIDDEN,
        ]);

        $this->assertDatabaseHas('product_pricing', [
            'tenant_id' => $tenant->id,
            'product_id' => $productId,
            'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
            'price' => 0,
        ]);

        $this->assertDatabaseHas('services', [
            'id' => $serviceId,
            'tenant_id' => $tenant->id,
            'product_id' => $productId,
            'server_id' => $server->id,
            'domain' => 'canadian-mcsa.com',
        ]);
    }

    /**
     * @return array{0: Tenant, 1: User, 2: Server, 3: Product, 4?: Client}
     */
    private function createImportContext(bool $withExistingClient = true): array
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Plesk Import Tenant',
            'slug' => 'plesk-import-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        License::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'license_key' => 'HOST-PLESK-IMPORT-001',
            'owner_email' => 'owner@plesk-import.test',
            'type' => License::PLAN_PROFESSIONAL,
            'plan' => License::PLAN_PROFESSIONAL,
            'license_type' => License::PLAN_PROFESSIONAL,
            'status' => License::STATUS_ACTIVE,
            'max_clients' => 500,
            'max_services' => 500,
            'activation_limit' => 2,
            'issued_at' => now(),
            'expires_at' => now()->addYear(),
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'plesk-import-admin@example.test',
        ]);

        $role = Role::query()->where('name', Role::TENANT_ADMIN)->firstOrFail();
        $user->roles()->attach($role);

        TenantUser::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        $product = Product::query()->create([
            'tenant_id' => $tenant->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Imported Plesk Hosting',
            'slug' => 'imported-plesk-hosting',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_PUBLIC,
            'display_order' => 0,
            'is_featured' => false,
            'provisioning_module' => Product::MODULE_PLESK,
        ]);

        $server = Server::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'name' => 'Import Plesk Node',
            'hostname' => '192.0.2.50',
            'panel_type' => Server::PANEL_PLESK,
            'api_endpoint' => 'https://192.0.2.50:8443',
            'api_port' => 8443,
            'status' => Server::STATUS_ACTIVE,
            'verify_ssl' => true,
            'max_accounts' => 200,
            'current_accounts' => 0,
            'username' => 'admin',
            'credentials' => [
                'api_key' => 'plesk-import-key',
            ],
        ]);

        if (! $withExistingClient) {
            return [$tenant, $user, $server, $product];
        }

        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Import Client',
            'email' => 'import-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        return [$tenant, $user, $server, $product, $client];
    }
}
