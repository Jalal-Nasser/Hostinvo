<?php

namespace Tests\Feature\Payments;

use App\Models\License;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantSetting;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantPaymentGatewaySettingsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_can_manage_payment_gateway_settings(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Gateway Settings Tenant',
            'slug' => 'gateway-settings-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        License::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'license_key' => 'HOST-GATEWAY-SETTINGS-001',
            'owner_email' => 'owner@gateway-settings.test',
            'type' => License::PLAN_PROFESSIONAL,
            'plan' => License::PLAN_PROFESSIONAL,
            'license_type' => License::PLAN_PROFESSIONAL,
            'status' => License::STATUS_ACTIVE,
            'max_clients' => 100,
            'max_services' => 100,
            'activation_limit' => 1,
            'issued_at' => now(),
            'expires_at' => now()->addMonth(),
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'admin@gateway-settings.test',
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

        Sanctum::actingAs($user);

        $this->putJson('/api/v1/admin/settings/payments/gateways', [
            'stripe' => [
                'enabled' => true,
                'publishable_key' => 'pk_test_hostinvo',
                'secret_key' => 'sk_test_hostinvo',
                'webhook_secret' => 'whsec_hostinvo',
            ],
            'paypal' => [
                'enabled' => true,
                'client_id' => 'paypal-client-id',
                'client_secret' => 'paypal-client-secret',
                'webhook_id' => 'paypal-webhook-id',
                'mode' => 'sandbox',
            ],
            'manual' => [
                'enabled' => true,
                'instructions' => 'Send the transfer receipt to billing@example.test.',
            ],
        ])->assertOk()
            ->assertJsonPath('data.stripe.enabled', true)
            ->assertJsonPath('data.paypal.mode', 'sandbox')
            ->assertJsonPath('data.manual.enabled', true);

        $this->getJson('/api/v1/admin/settings/payments/gateways')
            ->assertOk()
            ->assertJsonPath('data.stripe.publishable_key', 'pk_test_hostinvo')
            ->assertJsonPath('data.manual.instructions', 'Send the transfer receipt to billing@example.test.');

        $secretSetting = TenantSetting::query()
            ->where('tenant_id', $tenant->id)
            ->where('key', 'payments.stripe.secret_key')
            ->firstOrFail();

        $this->assertTrue((bool) $secretSetting->is_encrypted);
        $this->assertStringNotContainsString('sk_test_hostinvo', (string) $secretSetting->value);
    }
}
