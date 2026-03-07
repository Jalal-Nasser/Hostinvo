<?php

namespace Tests\Feature\Tenancy;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Tenancy\CurrentTenant;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantAwareScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_aware_models_are_filtered_by_the_current_tenant(): void
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

        User::factory()->create([
            'tenant_id' => $tenantA->id,
            'email' => 'a@tenant.test',
        ])->assignRole(Role::TENANT_ADMIN);

        User::factory()->create([
            'tenant_id' => $tenantB->id,
            'email' => 'b@tenant.test',
        ])->assignRole(Role::TENANT_ADMIN);

        app(CurrentTenant::class)->set($tenantA);

        $visibleEmails = User::query()->pluck('email');

        $this->assertTrue($visibleEmails->contains('a@tenant.test'));
        $this->assertFalse($visibleEmails->contains('b@tenant.test'));
    }
}
