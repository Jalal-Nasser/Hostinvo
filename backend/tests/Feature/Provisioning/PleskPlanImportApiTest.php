<?php

namespace Tests\Feature\Provisioning;

use App\Models\License;
use App\Models\Product;
use App\Models\ProductPricing;
use App\Models\Role;
use App\Models\Server;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PleskPlanImportApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_can_preview_plesk_service_plans_for_import(): void
    {
        [$tenant, $user, $server] = $this->createImportContext();

        $existingProduct = Product::query()->create([
            'tenant_id' => $tenant->id,
            'server_id' => $server->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Plesk Shared Basic',
            'slug' => 'plesk-shared-basic',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_HIDDEN,
            'display_order' => 0,
            'is_featured' => false,
            'provisioning_module' => Product::MODULE_PLESK,
            'provisioning_package' => 'Plesk Shared Basic',
        ]);

        $server->packages()->create([
            'tenant_id' => $tenant->id,
            'product_id' => $existingProduct->id,
            'panel_package_name' => 'Plesk Shared Basic',
            'display_name' => 'Plesk Shared Basic',
            'is_default' => true,
        ]);

        Sanctum::actingAs($user);

        Http::fake(function (Request $request) {
            $this->assertTrue(
                $request->hasHeader('Authorization', 'Basic '.base64_encode('admin:plesk-import-key'))
            );
            $this->assertStringEndsWith('/api/v2/cli/service_plan/call', $request->url());

            $payload = json_decode($request->body(), true);
            $params = $payload['params'] ?? [];

            return match ($params[0] ?? null) {
                '--list' => Http::response([
                    'code' => 0,
                    'stdout' => implode("\n", [
                        'Plesk Shared Basic',
                        'Plesk Reseller Pro',
                    ]),
                    'stderr' => '',
                ], 200),
                '--info' => Http::response([
                    'code' => 0,
                    'stdout' => match ($params[1] ?? '') {
                        'Plesk Shared Basic' => implode("\n", [
                            'Name: Plesk Shared Basic',
                            'Owner login: admin',
                            'Disk space: 5120 MB',
                            'Traffic: 10240 MB',
                            'Max site: 10',
                            'Max box: 50',
                            'Max DB: 10',
                        ]),
                        default => implode("\n", [
                            'Name: Plesk Reseller Pro',
                            'Owner login: reseller',
                            'Disk space: 20480 MB',
                            'Traffic: 51200 MB',
                            'Max site: 50',
                            'Max box: 200',
                            'Max DB: 50',
                        ]),
                    },
                    'stderr' => '',
                ], 200),
                default => Http::response(['code' => 1, 'stderr' => 'Unsupported command'], 200),
            };
        });

        $this->getJson("/api/v1/admin/servers/{$server->id}/imports/plesk-plans")
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.already_imported', 1)
            ->assertJsonPath('data.0.plan_name', 'Plesk Reseller Pro')
            ->assertJsonPath('data.1.plan_name', 'Plesk Shared Basic')
            ->assertJsonPath('data.1.existing_product.id', $existingProduct->id)
            ->assertJsonPath('data.1.disk_limit_mb', 5120)
            ->assertJsonPath('data.1.bandwidth_limit_mb', 10240);
    }

    public function test_tenant_admin_can_import_plesk_service_plans_as_local_products(): void
    {
        [$tenant, $user, $server] = $this->createImportContext();

        Sanctum::actingAs($user);

        Http::fake(function (Request $request) {
            $this->assertTrue(
                $request->hasHeader('Authorization', 'Basic '.base64_encode('admin:plesk-import-key'))
            );
            $this->assertStringEndsWith('/api/v2/cli/service_plan/call', $request->url());

            $payload = json_decode($request->body(), true);
            $params = $payload['params'] ?? [];

            return match ($params[0] ?? null) {
                '--info' => Http::response([
                    'code' => 0,
                    'stdout' => implode("\n", [
                        'Name: Plesk Business Plus',
                        'Owner login: admin',
                        'Disk space: 30720 MB',
                        'Traffic: 102400 MB',
                        'Max site: 25',
                        'Max box: 150',
                        'Max DB: 30',
                    ]),
                    'stderr' => '',
                ], 200),
                default => Http::response(['code' => 1, 'stderr' => 'Unsupported command'], 200),
            };
        });

        $response = $this->postJson("/api/v1/admin/servers/{$server->id}/imports/plesk-plans", [
            'imports' => [
                [
                    'plan_name' => 'Plesk Business Plus',
                    'product_name' => 'Business Plus Hosting',
                ],
            ],
        ]);

        $productId = $response->json('data.products.0.id');

        $response
            ->assertCreated()
            ->assertJsonPath('data.summary.products_created', 1)
            ->assertJsonPath('data.summary.products_mapped', 0)
            ->assertJsonPath('data.products.0.name', 'Business Plus Hosting')
            ->assertJsonPath('data.products.0.server_id', $server->id)
            ->assertJsonPath('data.products.0.provisioning_module', Product::MODULE_PLESK)
            ->assertJsonPath('data.products.0.provisioning_package', 'Plesk Business Plus')
            ->assertJsonPath('data.products.0.visibility', Product::VISIBILITY_HIDDEN);

        $this->assertDatabaseHas('products', [
            'id' => $productId,
            'tenant_id' => $tenant->id,
            'server_id' => $server->id,
            'name' => 'Business Plus Hosting',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_HIDDEN,
            'provisioning_module' => Product::MODULE_PLESK,
            'provisioning_package' => 'Plesk Business Plus',
        ]);

        $this->assertDatabaseHas('product_pricing', [
            'tenant_id' => $tenant->id,
            'product_id' => $productId,
            'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
            'currency' => 'USD',
            'price' => 0,
            'setup_fee' => 0,
            'is_enabled' => true,
        ]);

        $this->assertDatabaseHas('server_packages', [
            'tenant_id' => $tenant->id,
            'server_id' => $server->id,
            'product_id' => $productId,
            'panel_package_name' => 'Plesk Business Plus',
            'display_name' => 'Business Plus Hosting',
            'is_default' => true,
        ]);
    }

    /**
     * @return array{0: Tenant, 1: User, 2: Server}
     */
    private function createImportContext(): array
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Plesk Plan Import Tenant',
            'slug' => 'plesk-plan-import-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        License::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'license_key' => 'HOST-PLESK-PLAN-001',
            'owner_email' => 'owner@plesk-plan-import.test',
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
            'email' => 'plesk-plan-admin@example.test',
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

        $server = Server::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'name' => 'Import Plesk Plans Node',
            'hostname' => '192.0.2.60',
            'panel_type' => Server::PANEL_PLESK,
            'api_endpoint' => 'https://192.0.2.60:8443',
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

        return [$tenant, $user, $server];
    }
}
