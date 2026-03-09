<?php

namespace Tests\Feature\Auth;

use App\Models\Permission;
use App\Models\Tenant;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PermissionTenantScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_permissions_cannot_collide_with_platform_permission_names(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Scoped Tenant',
            'slug' => 'scoped-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $this->expectException(ValidationException::class);

        Permission::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'name' => 'dashboard.view',
            'guard_name' => 'web',
            'display_name' => 'Tenant Dashboard View',
        ]);
    }
}
