<?php

namespace Tests\Feature\Provisioning;

use App\Models\Client;
use App\Models\Product;
use App\Models\Role;
use App\Models\Server;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProvisioningTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_cannot_access_other_tenant_services(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenantA = Tenant::query()->create([
            'name' => 'Tenant A',
            'slug' => 'tenant-a',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $tenantB = Tenant::query()->create([
            'name' => 'Tenant B',
            'slug' => 'tenant-b',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $userA = User::factory()->create([
            'tenant_id' => $tenantA->id,
            'email' => 'tenant-a-admin@example.test',
        ]);

        $role = Role::query()->where('name', Role::TENANT_ADMIN)->firstOrFail();
        $userA->roles()->attach($role);

        TenantUser::query()->create([
            'tenant_id' => $tenantA->id,
            'user_id' => $userA->id,
            'role_id' => $role->id,
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        $clientB = Client::query()->create([
            'tenant_id' => $tenantB->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Tenant B Client',
            'email' => 'tenant-b-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $productB = Product::query()->create([
            'tenant_id' => $tenantB->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Tenant B Hosting',
            'slug' => 'tenant-b-hosting',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_PUBLIC,
            'display_order' => 0,
            'is_featured' => false,
        ]);

        $serverB = Server::query()->create([
            'tenant_id' => $tenantB->id,
            'name' => 'Tenant B Server',
            'hostname' => 'tenant-b-node.example.test',
            'panel_type' => Server::PANEL_CPANEL,
            'api_endpoint' => 'https://tenant-b-node.example.test:2087',
            'status' => Server::STATUS_ACTIVE,
            'verify_ssl' => true,
            'max_accounts' => 50,
            'current_accounts' => 0,
        ]);

        $serviceB = Service::query()->create([
            'tenant_id' => $tenantB->id,
            'client_id' => $clientB->id,
            'product_id' => $productB->id,
            'server_id' => $serverB->id,
            'reference_number' => 'SVC-TENANT-B',
            'service_type' => Service::TYPE_HOSTING,
            'status' => Service::STATUS_PENDING,
            'provisioning_state' => Service::PROVISIONING_IDLE,
            'billing_cycle' => 'monthly',
            'domain' => 'tenant-b.example.test',
        ]);

        Sanctum::actingAs($userA);

        $this->getJson("/api/v1/admin/services/{$serviceB->id}")
            ->assertForbidden();

        $this->postJson("/api/v1/admin/services/{$serviceB->id}/operations/create_account", [
            'payload' => [],
        ])->assertNotFound();
    }
}
