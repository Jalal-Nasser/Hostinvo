<?php

namespace Tests\Feature\Domains;

use App\Models\Client;
use App\Models\Domain;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DomainTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_domain_routes_do_not_allow_cross_tenant_access(): void
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

        $user = User::factory()->create([
            'tenant_id' => $tenantA->id,
            'email' => 'admin@tenant-a.test',
        ]);

        $role = Role::query()->where('name', Role::TENANT_ADMIN)->firstOrFail();
        $user->roles()->attach($role);

        TenantUser::query()->forceCreate([
            'tenant_id' => $tenantA->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        $foreignClient = Client::query()->forceCreate([
            'tenant_id' => $tenantB->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Foreign Client',
            'email' => 'foreign-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $foreignDomain = Domain::query()->create([
            'tenant_id' => $tenantB->id,
            'client_id' => $foreignClient->id,
            'domain' => 'foreign.example',
            'tld' => 'example',
            'status' => Domain::STATUS_ACTIVE,
            'expiry_date' => now()->addYear()->toDateString(),
            'auto_renew' => true,
            'dns_management' => false,
            'id_protection' => false,
            'currency' => 'USD',
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/v1/admin/domains/{$foreignDomain->id}")
            ->assertForbidden();
    }
}
