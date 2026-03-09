<?php

namespace Tests\Feature\Provisioning;

use App\Models\Client;
use App\Models\Product;
use App\Models\ProvisioningJob;
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

class PleskMonitoringApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_can_test_plesk_connections_and_retry_failed_jobs(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Plesk Tenant',
            'slug' => 'plesk-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'plesk-admin@example.test',
        ]);

        $role = Role::query()->where('name', Role::TENANT_ADMIN)->firstOrFail();
        $user->roles()->attach($role);

        TenantUser::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        $client = Client::query()->create([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Plesk Client',
            'email' => 'client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $product = Product::query()->create([
            'tenant_id' => $tenant->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Plesk Hosting',
            'slug' => 'plesk-hosting',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_PUBLIC,
            'display_order' => 0,
            'is_featured' => false,
        ]);

        $server = Server::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Plesk Node',
            'hostname' => '192.0.2.10',
            'panel_type' => Server::PANEL_PLESK,
            'api_endpoint' => 'https://192.0.2.10:8443',
            'api_port' => 8443,
            'status' => Server::STATUS_ACTIVE,
            'verify_ssl' => true,
            'max_accounts' => 100,
            'current_accounts' => 0,
            'username' => 'admin',
            'credentials' => [
                'api_key' => 'plesk-api-key',
            ],
        ]);

        $service = Service::query()->create([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'product_id' => $product->id,
            'server_id' => $server->id,
            'reference_number' => 'SVC-PLESK-1',
            'service_type' => Service::TYPE_HOSTING,
            'status' => Service::STATUS_PENDING,
            'provisioning_state' => Service::PROVISIONING_IDLE,
            'billing_cycle' => 'monthly',
            'domain' => 'customer.example.test',
            'username' => 'pleskuser1',
        ]);

        Sanctum::actingAs($user);

        Http::fake([
            'https://192.0.2.10:8443/api/v2/server' => Http::response([
                'hostname' => 'plesk-node.example.test',
                'version' => '18.0.70',
                'platform' => 'Obsidian',
            ], 200),
        ]);

        $this->postJson("/api/v1/admin/servers/{$server->id}/test")
            ->assertOk()
            ->assertJsonPath('data.successful', true)
            ->assertJsonPath('data.version', '18.0.70');

        $this->assertNotNull($server->fresh()->last_tested_at);

        $failedDispatch = $this->postJson("/api/v1/admin/services/{$service->id}/operations/create_account", [
            'payload' => [],
        ]);

        $failedJobId = $failedDispatch->json('data.id');

        $failedDispatch
            ->assertAccepted()
            ->assertJsonPath('data.status', ProvisioningJob::STATUS_FAILED);

        $server->packages()->create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'panel_package_name' => 'Plesk Shared Basic',
            'display_name' => 'Plesk Shared Basic',
            'is_default' => true,
        ]);

        Http::fake(function (Request $request) {
            if ($request->url() === 'https://192.0.2.10:8443/api/v2/cli/subscription/call') {
                return Http::response([
                    'code' => 0,
                    'stdout' => implode("\n", [
                        'Subscription: customer.example.test',
                        'System user: pleskuser1',
                        'Service plan: Plesk Shared Basic',
                        'Status: Active',
                    ]),
                    'stderr' => '',
                ], 200);
            }

            return Http::response([], 404);
        });

        $this->postJson("/api/v1/admin/provisioning-jobs/{$failedJobId}/retry")
            ->assertAccepted()
            ->assertJsonPath('data.status', ProvisioningJob::STATUS_COMPLETED)
            ->assertJsonPath('data.operation', ProvisioningJob::OPERATION_CREATE_ACCOUNT);

        $this->assertDatabaseHas('provisioning_jobs', [
            'id' => $failedJobId,
            'status' => ProvisioningJob::STATUS_FAILED,
        ]);

        $this->assertDatabaseHas('services', [
            'id' => $service->id,
            'status' => Service::STATUS_ACTIVE,
            'provisioning_state' => Service::PROVISIONING_SYNCED,
            'username' => 'pleskuser1',
            'external_reference' => 'customer.example.test',
        ]);
    }

    public function test_plesk_driver_processes_lifecycle_operations_and_sync_payloads(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Plesk Lifecycle Tenant',
            'slug' => 'plesk-lifecycle-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'plesk-lifecycle@example.test',
        ]);

        $role = Role::query()->where('name', Role::TENANT_ADMIN)->firstOrFail();
        $user->roles()->attach($role);

        TenantUser::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        $client = Client::query()->create([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Lifecycle Client',
            'email' => 'lifecycle-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $product = Product::query()->create([
            'tenant_id' => $tenant->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Lifecycle Hosting',
            'slug' => 'lifecycle-hosting',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_PUBLIC,
            'display_order' => 0,
            'is_featured' => false,
        ]);

        $server = Server::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Lifecycle Plesk Node',
            'hostname' => '192.0.2.20',
            'panel_type' => Server::PANEL_PLESK,
            'api_endpoint' => 'https://192.0.2.20:8443',
            'api_port' => 8443,
            'status' => Server::STATUS_ACTIVE,
            'verify_ssl' => true,
            'max_accounts' => 200,
            'current_accounts' => 1,
            'username' => 'admin',
            'credentials' => [
                'api_key' => 'plesk-lifecycle-key',
            ],
        ]);

        $basicPackage = $server->packages()->create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'panel_package_name' => 'Plesk Shared Basic',
            'display_name' => 'Plesk Shared Basic',
            'is_default' => true,
        ]);

        $service = Service::query()->create([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'product_id' => $product->id,
            'server_id' => $server->id,
            'server_package_id' => $basicPackage->id,
            'reference_number' => 'SVC-PLESK-LIFECYCLE',
            'service_type' => Service::TYPE_HOSTING,
            'status' => Service::STATUS_ACTIVE,
            'provisioning_state' => Service::PROVISIONING_SYNCED,
            'billing_cycle' => 'monthly',
            'domain' => 'lifecycle.example.test',
            'username' => 'plesklife1',
            'external_reference' => 'lifecycle.example.test',
        ]);

        Sanctum::actingAs($user);

        $infoResponses = [
            implode("\n", [
                'Subscription: lifecycle.example.test',
                'System user: plesklife1',
                'Service plan: Plesk Shared Plus',
                'Status: Active',
                'Disk space: 2048 MB',
                'Hard disk quota: 10240 MB',
                'Traffic: 512 MB',
                'Traffic limit: 20480 MB',
                'Mailboxes: 4',
                'Databases: 2',
            ]),
            implode("\n", [
                'Subscription: lifecycle.example.test',
                'System user: plesklife1',
                'Service plan: Plesk Shared Plus',
                'Status: Suspended',
                'Suspend reason: Manual hold',
            ]),
        ];

        Http::fake(function (Request $request) use (&$infoResponses) {
            if ($request->url() !== 'https://192.0.2.20:8443/api/v2/cli/subscription/call') {
                return Http::response([], 404);
            }

            $payload = json_decode($request->body(), true);
            $params = $payload['params'] ?? [];
            $operation = $params[0] ?? null;

            return match ($operation) {
                '--webspace-off' => Http::response(['code' => 0, 'stdout' => 'Status: Suspended', 'stderr' => ''], 200),
                '--webspace-on' => Http::response(['code' => 0, 'stdout' => 'Status: Active', 'stderr' => ''], 200),
                '--switch-subscription' => Http::response(['code' => 0, 'stdout' => 'Service plan: Plesk Shared Plus', 'stderr' => ''], 200),
                '--update' => Http::response(['code' => 0, 'stdout' => 'Password updated', 'stderr' => ''], 200),
                '--info' => Http::response([
                    'code' => 0,
                    'stdout' => array_shift($infoResponses) ?? 'Status: Active',
                    'stderr' => '',
                ], 200),
                '--remove' => Http::response(['code' => 0, 'stdout' => 'Subscription removed', 'stderr' => ''], 200),
                default => Http::response(['code' => 1, 'stderr' => 'Unsupported test operation'], 200),
            };
        });

        $this->postJson("/api/v1/admin/services/{$service->id}/operations/suspend_account", [
            'payload' => [],
        ])
            ->assertAccepted()
            ->assertJsonPath('data.status', ProvisioningJob::STATUS_COMPLETED);

        $this->assertDatabaseHas('services', [
            'id' => $service->id,
            'status' => Service::STATUS_SUSPENDED,
            'provisioning_state' => Service::PROVISIONING_SYNCED,
        ]);

        $this->postJson("/api/v1/admin/services/{$service->id}/operations/unsuspend_account", [
            'payload' => [],
        ])
            ->assertAccepted()
            ->assertJsonPath('data.status', ProvisioningJob::STATUS_COMPLETED);

        $this->assertDatabaseHas('services', [
            'id' => $service->id,
            'status' => Service::STATUS_ACTIVE,
        ]);

        $this->postJson("/api/v1/admin/services/{$service->id}/operations/change_package", [
            'payload' => [
                'panel_package_name' => 'Plesk Shared Plus',
            ],
        ])
            ->assertAccepted()
            ->assertJsonPath('data.status', ProvisioningJob::STATUS_COMPLETED);

        $this->assertSame(
            'Plesk Shared Plus',
            $service->fresh()->metadata['panel']['service_plan'] ?? null,
        );

        $this->postJson("/api/v1/admin/services/{$service->id}/operations/reset_password", [
            'payload' => [
                'password' => 'NewSecret123!',
            ],
        ])
            ->assertAccepted()
            ->assertJsonPath('data.status', ProvisioningJob::STATUS_COMPLETED);

        $credential = $service->fresh()->credentials;

        $this->assertNotNull($credential);
        $this->assertSame('NewSecret123!', $credential?->decryptValue());
        $this->assertNull($credential?->credentials['password'] ?? null);

        $this->postJson("/api/v1/admin/services/{$service->id}/operations/sync_usage", [
            'payload' => [],
        ])
            ->assertAccepted()
            ->assertJsonPath('data.status', ProvisioningJob::STATUS_COMPLETED);

        $service = $service->fresh();

        $this->assertSame(2048, $service->usage?->disk_used_mb);
        $this->assertSame(10240, $service->usage?->disk_limit_mb);
        $this->assertSame(512, $service->usage?->bandwidth_used_mb);
        $this->assertSame(20480, $service->usage?->bandwidth_limit_mb);
        $this->assertSame(4, $service->usage?->email_accounts_used);
        $this->assertSame(2, $service->usage?->databases_used);

        $this->postJson("/api/v1/admin/services/{$service->id}/operations/sync_service_status", [
            'payload' => [],
        ])
            ->assertAccepted()
            ->assertJsonPath('data.status', ProvisioningJob::STATUS_COMPLETED);

        $this->assertDatabaseHas('services', [
            'id' => $service->id,
            'status' => Service::STATUS_SUSPENDED,
            'provisioning_state' => Service::PROVISIONING_SYNCED,
        ]);

        $this->postJson("/api/v1/admin/services/{$service->id}/operations/terminate_account", [
            'payload' => [],
        ])
            ->assertAccepted()
            ->assertJsonPath('data.status', ProvisioningJob::STATUS_COMPLETED);

        $this->assertDatabaseHas('services', [
            'id' => $service->id,
            'status' => Service::STATUS_TERMINATED,
        ]);

        $this->assertSame(0, $server->fresh()->current_accounts);
    }
}
