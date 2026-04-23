<?php

namespace Tests\Feature\Clients;

use App\Models\Client;
use App\Models\License;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClientPortalAccessApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_can_create_client_with_portal_access(): void
    {
        Mail::fake();
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Portal Access Tenant',
            'slug' => 'portal-access-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        License::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'license_key' => 'HOST-PORTAL-ACCESS-001',
            'owner_email' => 'owner@portal-access.test',
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

        $admin = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'admin@portal-access.test',
        ]);

        $role = Role::query()->where('name', Role::TENANT_ADMIN)->firstOrFail();
        $admin->roles()->attach($role);

        TenantUser::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'user_id' => $admin->id,
            'role_id' => $role->id,
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/admin/clients', [
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Portal Access Client',
            'email' => 'client-portal@example.test',
            'phone' => '+155500001',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
            'notes' => 'Portal enabled client.',
            'portal_access' => [
                'enabled' => true,
                'password' => 'ChangeMe123!',
                'send_verification_email' => true,
            ],
        ]);

        $clientId = $response->json('data.id');
        $userId = $response->json('data.user_id');

        $response->assertCreated()
            ->assertJsonPath('data.user_id', $userId)
            ->assertJsonPath('data.owner.email', 'client-portal@example.test');

        $portalUser = User::query()->findOrFail($userId);

        $this->assertTrue(Hash::check('ChangeMe123!', (string) $portalUser->password));
        $this->assertTrue($portalUser->hasRole(Role::CLIENT_USER));

        $this->assertDatabaseHas('clients', [
            'id' => $clientId,
            'user_id' => $portalUser->id,
        ]);

        $this->assertDatabaseHas('email_logs', [
            'tenant_id' => $tenant->id,
            'to_email' => 'client-portal@example.test',
            'event' => 'client_account_created',
            'status' => 'sent',
        ]);

        $this->assertDatabaseHas('email_logs', [
            'tenant_id' => $tenant->id,
            'to_email' => 'client-portal@example.test',
            'event' => 'account_email_verification',
            'status' => 'sent',
        ]);
    }
}
