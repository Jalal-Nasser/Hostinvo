<?php

namespace Tests\Feature\Integration;

use App\Models\License;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Support\Tenancy\CurrentTenant;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

abstract class IntegrationTestCase extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    protected function createTenant(string $slug, array $overrides = []): Tenant
    {
        $tenant = Tenant::query()->create(array_merge([
            'name' => (string) Str::of($slug)->replace('-', ' ')->title(),
            'slug' => $slug,
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ], $overrides));

        License::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'license_key' => 'HOST-'.strtoupper((string) Str::of($slug)->replace('-', '')->limit(18, '')) . '-TEST',
            'owner_email' => "{$slug}@example.test",
            'type' => License::PLAN_PROFESSIONAL,
            'plan' => License::PLAN_PROFESSIONAL,
            'license_type' => License::PLAN_PROFESSIONAL,
            'status' => License::STATUS_ACTIVE,
            'domain' => 'localhost',
            'max_clients' => 500,
            'max_services' => 500,
            'activation_limit' => 2,
            'issued_at' => now(),
            'expires_at' => now()->addMonth(),
        ]);

        return $tenant;
    }

    protected function createTenantAdmin(Tenant $tenant, string $email, array $overrides = []): User
    {
        $user = User::factory()->create(array_merge([
            'tenant_id' => $tenant->id,
            'email' => $email,
        ], $overrides));

        $role = Role::query()->where('name', Role::TENANT_ADMIN)->firstOrFail();
        $user->roles()->attach($role);

        TenantUser::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        return $user;
    }

    protected function setTenantContext(Tenant $tenant): void
    {
        app(CurrentTenant::class)->set($tenant);
        app()->instance('tenant', $tenant);
    }

    protected function clearTenantContext(): void
    {
        app(CurrentTenant::class)->clear();
        app()->forgetInstance('tenant');
    }
}
