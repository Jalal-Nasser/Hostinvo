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
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CpanelMonitoringApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_can_test_cpanel_connections_and_retry_failed_jobs(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'cPanel Tenant',
            'slug' => 'cpanel-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'cpanel-admin@example.test',
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

        $client = Client::query()->create([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'cPanel Client',
            'email' => 'client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $product = Product::query()->create([
            'tenant_id' => $tenant->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Shared Hosting',
            'slug' => 'shared-hosting',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_PUBLIC,
            'display_order' => 0,
            'is_featured' => false,
        ]);

        $server = Server::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'name' => 'cPanel Node',
            'hostname' => 'cpanel-node.example.test',
            'panel_type' => Server::PANEL_CPANEL,
            'api_endpoint' => 'https://cpanel-node.example.test:2087',
            'api_port' => 2087,
            'status' => Server::STATUS_ACTIVE,
            'verify_ssl' => true,
            'max_accounts' => 100,
            'current_accounts' => 0,
            'username' => 'root',
            'credentials' => [
                'api_token' => 'cpanel-token',
            ],
        ]);

        $service = Service::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'product_id' => $product->id,
            'server_id' => $server->id,
            'reference_number' => 'SVC-CPANEL-1',
            'service_type' => Service::TYPE_HOSTING,
            'status' => Service::STATUS_PENDING,
            'provisioning_state' => Service::PROVISIONING_IDLE,
            'billing_cycle' => 'monthly',
            'domain' => 'customer.example.test',
            'username' => 'customer1',
        ]);

        Sanctum::actingAs($user);

        Http::fake([
            '*json-api/version*' => Http::response([
                'metadata' => [
                    'result' => 1,
                    'reason' => 'OK',
                    'command' => 'version',
                ],
                'data' => [
                    'version' => '11.120.0.14',
                ],
            ], 200),
        ]);

        $this->postJson("/api/v1/admin/servers/{$server->id}/test")
            ->assertOk()
            ->assertJsonPath('data.successful', true)
            ->assertJsonPath('data.version', '11.120.0.14');

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
            'panel_package_name' => 'shared_basic',
            'display_name' => 'Shared Basic',
            'is_default' => true,
        ]);

        Http::fake([
            '*json-api/createacct*' => Http::response([
                'metadata' => [
                    'result' => 1,
                    'reason' => 'OK',
                    'command' => 'createacct',
                ],
                'data' => [
                    'user' => 'customer1',
                    'domain' => 'customer.example.test',
                    'ip' => '127.0.0.10',
                ],
            ], 200),
        ]);

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
            'username' => 'customer1',
        ]);
    }
}
