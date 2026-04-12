<?php

namespace Tests\Feature\Security;

use App\Models\Client;
use App\Models\License;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Security\TurnstileService;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantTurnstileConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_client_receives_tenant_turnstile_auth_config_aliases(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = $this->createTenant('turnstile-auth-config');
        [$portalUser] = $this->createPortalUserWithClient($tenant, 'portal-turnstile-config@gmail.com', 'Portal Config');

        app(TurnstileService::class)->updateTenantConfig($tenant, [
            'enabled' => true,
            'use_custom_keys' => true,
            'site_key' => 'tenant-site-key',
            'secret_key' => 'tenant-secret-key',
            'forms' => [
                'client_login' => true,
                'portal_forgot_password' => true,
                'portal_reset_password' => true,
                'portal_support' => false,
            ],
        ]);

        Sanctum::actingAs($portalUser);

        $this->getJson('/api/v1/auth/config')
            ->assertOk()
            ->assertJsonPath('data.turnstile.enabled', true)
            ->assertJsonPath('data.turnstile.site_key', 'tenant-site-key')
            ->assertJsonPath('data.turnstile.forms.login', true)
            ->assertJsonPath('data.turnstile.forms.forgot_password', true)
            ->assertJsonPath('data.turnstile.forms.reset_password', true);
    }

    public function test_client_portal_ticket_creation_requires_turnstile_when_tenant_support_form_is_protected(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = $this->createTenant('turnstile-support-form');
        [$portalUser] = $this->createPortalUserWithClient($tenant, 'portal-turnstile-support@gmail.com', 'Portal Support');

        app(TurnstileService::class)->updateTenantConfig($tenant, [
            'enabled' => true,
            'use_custom_keys' => true,
            'site_key' => 'tenant-site-key',
            'secret_key' => 'tenant-secret-key',
            'forms' => [
                'portal_support' => true,
            ],
        ]);

        Sanctum::actingAs($portalUser);

        $this->postJson('/api/v1/client/tickets', [
            'subject' => 'Protected support request',
            'priority' => 'medium',
            'message' => 'Turnstile token should be required.',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['turnstile_token']);
    }

    private function createTenant(string $slug): Tenant
    {
        $tenant = Tenant::query()->create([
            'name' => str_replace('-', ' ', ucfirst($slug)),
            'slug' => $slug,
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        License::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'license_key' => strtoupper("HOST-{$slug}-001"),
            'owner_email' => "owner-{$slug}@example.test",
            'type' => License::PLAN_PROFESSIONAL,
            'plan' => License::PLAN_PROFESSIONAL,
            'license_type' => License::PLAN_PROFESSIONAL,
            'status' => License::STATUS_ACTIVE,
            'max_clients' => 500,
            'max_services' => 500,
            'activation_limit' => 5,
            'issued_at' => now(),
            'expires_at' => now()->addYear(),
        ]);

        return $tenant;
    }

    private function createPortalUserWithClient(Tenant $tenant, string $email, string $companyName): array
    {
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => $email,
        ]);

        $role = Role::query()->where('name', Role::CLIENT_USER)->firstOrFail();
        $user->roles()->attach($role);

        TenantUser::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => $companyName,
            'email' => $email,
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        return [$user, $client];
    }
}
