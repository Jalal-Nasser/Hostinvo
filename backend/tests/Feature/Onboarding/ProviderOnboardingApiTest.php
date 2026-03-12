<?php

namespace Tests\Feature\Onboarding;

use App\Models\License;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProviderOnboardingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_provider_registration_creates_tenant_owner_and_license_activation(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $license = License::query()->create([
            'license_key' => 'HOST-LAUNCH-001',
            'owner_email' => 'launch-owner@example.test',
            'plan' => License::PLAN_STARTER,
            'status' => License::STATUS_ACTIVE,
            'max_clients' => 250,
            'max_services' => 5,
            'activation_limit' => 1,
            'issued_at' => now(),
            'expires_at' => now()->addYear(),
        ]);

        $response = $this->postJson('/api/v1/auth/provider-register', [
            'name' => 'Launch Owner',
            'email' => 'owner@launch-provider.test',
            'password' => 'secret-pass-123',
            'password_confirmation' => 'secret-pass-123',
            'company_name' => 'Launch Provider',
            'company_domain' => 'launch-provider.test',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'license_key' => $license->license_key,
            'license_domain' => 'launch-provider.test',
            'license_instance_id' => 'launch-node-1',
        ]);

        $tenantId = $response->json('data.user.tenant.id');
        $userId = $response->json('data.user.id');

        $response
            ->assertCreated()
            ->assertJsonPath('data.user.email', 'owner@launch-provider.test')
            ->assertJsonPath('data.license.license.plan', License::PLAN_STARTER)
            ->assertJsonPath('data.license.activation.instance_id', 'launch-node-1');

        $this->assertDatabaseHas('tenants', [
            'id' => $tenantId,
            'name' => 'Launch Provider',
            'primary_domain' => 'launch-provider.test',
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $userId,
            'tenant_id' => $tenantId,
            'email' => 'owner@launch-provider.test',
        ]);

        $this->assertDatabaseHas('tenant_users', [
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'is_primary' => true,
        ]);

        $this->assertDatabaseHas('licenses', [
            'id' => $license->id,
            'tenant_id' => $tenantId,
        ]);

        $this->assertDatabaseHas('license_activations', [
            'license_id' => $license->id,
            'tenant_id' => $tenantId,
            'domain' => 'launch-provider.test',
            'instance_id' => 'launch-node-1',
        ]);
    }

    public function test_onboarding_status_and_company_update_endpoints_work_for_tenant_owner(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Onboarding Tenant',
            'slug' => 'onboarding-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'owner@onboarding.test',
        ]);

        $role = Role::query()->where('name', Role::TENANT_OWNER)->firstOrFail();
        $user->roles()->attach($role);

        TenantUser::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/onboarding/status')
            ->assertOk()
            ->assertJsonPath('data.steps.0.key', 'create_account')
            ->assertJsonPath('data.steps.0.complete', true)
            ->assertJsonPath('data.steps.1.key', 'configure_company')
            ->assertJsonPath('data.steps.1.complete', false);

        $this->putJson('/api/v1/auth/onboarding/company', [
            'company_name' => 'Configured Tenant',
            'company_domain' => 'configured-tenant.test',
            'default_locale' => 'ar',
            'default_currency' => 'SAR',
            'timezone' => 'Asia/Riyadh',
        ])->assertOk()
            ->assertJsonPath('data.tenant.name', 'Configured Tenant')
            ->assertJsonPath('data.tenant.primary_domain', 'configured-tenant.test');

        $this->assertDatabaseHas('tenants', [
            'id' => $tenant->id,
            'name' => 'Configured Tenant',
            'primary_domain' => 'configured-tenant.test',
            'default_locale' => 'ar',
            'default_currency' => 'SAR',
            'timezone' => 'Asia/Riyadh',
        ]);
    }
}
