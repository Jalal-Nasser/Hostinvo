<?php

namespace Tests\Feature\Licensing;

use App\Models\License;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LicenseEnforcementMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_protected_api_routes_require_an_active_license(): void
    {
        [$tenant, $user] = $this->createTenantAdminContext('licensed-middleware-missing');

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/admin/clients')
            ->assertForbidden()
            ->assertJsonPath('errors.0.reason', 'missing');
    }

    public function test_protected_api_routes_reject_expired_trials(): void
    {
        [$tenant, $user] = $this->createTenantAdminContext('licensed-middleware-trial');

        License::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'license_key' => 'HOST-TRIAL-EXPIRED',
            'owner_email' => 'trial@example.test',
            'type' => License::PLAN_FREE_TRIAL,
            'plan' => License::PLAN_FREE_TRIAL,
            'status' => License::STATUS_ACTIVE,
            'max_clients' => 3,
            'max_services' => 1,
            'activation_limit' => 1,
            'issued_at' => now()->subDays(10),
            'expires_at' => now()->subDay(),
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/admin/clients')
            ->assertForbidden()
            ->assertJsonPath('errors.0.reason', 'trial_expired');
    }

    public function test_protected_api_routes_reject_domain_mismatches(): void
    {
        [$tenant, $user] = $this->createTenantAdminContext('licensed-middleware-domain');

        License::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'license_key' => 'HOST-DOMAIN-MISMATCH',
            'owner_email' => 'domain@example.test',
            'type' => License::PLAN_STARTER,
            'plan' => License::PLAN_STARTER,
            'status' => License::STATUS_ACTIVE,
            'domain' => 'licensed.example.test',
            'max_clients' => 35,
            'max_services' => 5,
            'activation_limit' => 1,
            'issued_at' => now(),
            'expires_at' => now()->addMonth(),
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/admin/clients')
            ->assertForbidden()
            ->assertJsonPath('errors.0.reason', 'domain_mismatch');
    }

    public function test_protected_api_routes_reject_installation_mismatches(): void
    {
        [$tenant, $user] = $this->createTenantAdminContext('licensed-middleware-installation');

        License::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'license_key' => 'HOST-INSTALL-MISMATCH',
            'owner_email' => 'installation@example.test',
            'type' => License::PLAN_STARTER,
            'plan' => License::PLAN_STARTER,
            'status' => License::STATUS_ACTIVE,
            'installation_hash' => 'not-the-current-installation',
            'max_clients' => 35,
            'max_services' => 5,
            'activation_limit' => 1,
            'issued_at' => now(),
            'expires_at' => now()->addMonth(),
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/admin/clients')
            ->assertForbidden()
            ->assertJsonPath('errors.0.reason', 'installation_mismatch');
    }

    public function test_protected_api_routes_allow_valid_licenses(): void
    {
        [$tenant, $user] = $this->createTenantAdminContext('licensed-middleware-valid');

        License::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'license_key' => 'HOST-VALID-001',
            'owner_email' => 'valid@example.test',
            'type' => License::PLAN_PROFESSIONAL,
            'plan' => License::PLAN_PROFESSIONAL,
            'status' => License::STATUS_ACTIVE,
            'max_clients' => 500,
            'max_services' => 20,
            'activation_limit' => 2,
            'issued_at' => now(),
            'expires_at' => now()->addMonth(),
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/admin/clients')
            ->assertOk();
    }

    /**
     * @return array{0: Tenant, 1: User}
     */
    private function createTenantAdminContext(string $slug): array
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => ucfirst($slug).' Hosting',
            'slug' => $slug,
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => "{$slug}@example.test",
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

        return [$tenant, $user];
    }
}
