<?php

namespace Tests\Feature\Provisioning;

use App\Models\Client;
use App\Models\Product;
use App\Models\ProvisioningJob;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProvisioningFoundationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_can_create_foundation_records_and_dispatch_provisioning(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Provisioning Tenant',
            'slug' => 'provisioning-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'provisioning-admin@example.test',
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
            'company_name' => 'Acme Hosting',
            'email' => 'client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $product = Product::query()->create([
            'tenant_id' => $tenant->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Managed Hosting',
            'slug' => 'managed-hosting',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_PUBLIC,
            'display_order' => 0,
            'is_featured' => false,
        ]);

        Sanctum::actingAs($user);

        $serverGroupResponse = $this->postJson('/api/v1/admin/server-groups', [
            'name' => 'Primary Group',
            'selection_strategy' => 'least_accounts',
            'status' => 'active',
            'notes' => 'Primary provisioning group.',
        ]);

        $serverGroupId = $serverGroupResponse->json('data.id');

        $serverGroupResponse
            ->assertCreated()
            ->assertJsonPath('data.name', 'Primary Group');

        $serverResponse = $this->postJson('/api/v1/admin/servers', [
            'server_group_id' => $serverGroupId,
            'name' => 'Primary Node',
            'hostname' => 'node-1.example.test',
            'panel_type' => 'cpanel',
            'api_endpoint' => 'https://node-1.example.test:2087',
            'api_port' => 2087,
            'status' => 'active',
            'verify_ssl' => true,
            'max_accounts' => 250,
            'current_accounts' => 0,
            'username' => 'root',
            'credentials' => [
                'api_token' => 'placeholder-token',
            ],
            'packages' => [
                [
                    'product_id' => $product->id,
                    'panel_package_name' => 'managed_basic',
                    'display_name' => 'Managed Basic',
                    'is_default' => true,
                ],
            ],
        ]);

        $serverId = $serverResponse->json('data.id');

        $serverResponse
            ->assertCreated()
            ->assertJsonPath('data.hostname', 'node-1.example.test')
            ->assertJsonPath('data.packages.0.product.id', $product->id);

        $serviceResponse = $this->postJson('/api/v1/admin/services', [
            'client_id' => $client->id,
            'product_id' => $product->id,
            'server_id' => $serverId,
            'billing_cycle' => 'monthly',
            'service_type' => 'hosting',
            'status' => 'pending',
            'provisioning_state' => 'idle',
            'domain' => 'customer.example.test',
            'username' => 'customer1',
            'notes' => 'Provision this service through the queue foundation.',
        ]);

        $serviceId = $serviceResponse->json('data.id');

        $serviceResponse
            ->assertCreated()
            ->assertJsonPath('data.client.id', $client->id)
            ->assertJsonPath('data.product.id', $product->id)
            ->assertJsonPath('data.server.id', $serverId);

        $dispatchResponse = $this->postJson("/api/v1/admin/services/{$serviceId}/operations/create_account", [
            'payload' => [],
        ]);

        $dispatchResponse
            ->assertAccepted()
            ->assertJsonPath('data.operation', ProvisioningJob::OPERATION_CREATE_ACCOUNT)
            ->assertJsonPath('data.status', ProvisioningJob::STATUS_COMPLETED);

        $this->assertDatabaseHas('provisioning_jobs', [
            'service_id' => $serviceId,
            'operation' => ProvisioningJob::OPERATION_CREATE_ACCOUNT,
            'status' => ProvisioningJob::STATUS_COMPLETED,
        ]);

        $this->assertDatabaseHas('services', [
            'id' => $serviceId,
            'status' => 'active',
            'provisioning_state' => 'placeholder',
        ]);

        $this->getJson('/api/v1/admin/services')
            ->assertOk()
            ->assertJsonPath('data.0.id', $serviceId);

        $this->getJson('/api/v1/admin/provisioning-jobs')
            ->assertOk()
            ->assertJsonPath('data.0.service_id', $serviceId);
    }
}
