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

class DomainPortalApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_portal_user_can_only_access_owned_domains(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Portal Tenant',
            'slug' => 'portal-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $portalUser = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'portal@tenant.test',
        ]);

        $role = Role::query()->where('name', Role::CLIENT_USER)->firstOrFail();
        $portalUser->roles()->attach($role);

        TenantUser::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $portalUser->id,
            'role_id' => $role->id,
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        $ownedClient = Client::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $portalUser->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Owned Client',
            'email' => 'owned@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $foreignClient = Client::query()->create([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Foreign Client',
            'email' => 'foreign@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $ownedDomain = Domain::query()->create([
            'tenant_id' => $tenant->id,
            'client_id' => $ownedClient->id,
            'domain' => 'owned-example.test',
            'tld' => 'test',
            'status' => Domain::STATUS_ACTIVE,
            'expiry_date' => now()->addYear()->toDateString(),
            'auto_renew' => true,
            'dns_management' => false,
            'id_protection' => false,
            'currency' => 'USD',
        ]);

        $foreignDomain = Domain::query()->create([
            'tenant_id' => $tenant->id,
            'client_id' => $foreignClient->id,
            'domain' => 'foreign-example.test',
            'tld' => 'test',
            'status' => Domain::STATUS_ACTIVE,
            'expiry_date' => now()->addYear()->toDateString(),
            'auto_renew' => true,
            'dns_management' => false,
            'id_protection' => false,
            'currency' => 'USD',
        ]);

        Sanctum::actingAs($portalUser);

        $this->getJson('/api/v1/client/domains')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ownedDomain->id);

        $this->getJson("/api/v1/client/domains/{$ownedDomain->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $ownedDomain->id);

        $this->getJson("/api/v1/client/domains/{$foreignDomain->id}")
            ->assertForbidden();

        $this->putJson("/api/v1/client/domains/{$ownedDomain->id}/contacts", [
            'contacts' => [
                [
                    'type' => 'registrant',
                    'first_name' => 'Portal',
                    'last_name' => 'Owner',
                    'email' => 'portal-owner@example.test',
                    'phone' => '+1555000001',
                    'address' => [
                        'line1' => 'Main Street',
                        'city' => 'Austin',
                        'state' => 'Texas',
                        'postal_code' => '73301',
                        'country' => 'us',
                    ],
                ],
                [
                    'type' => 'admin',
                    'first_name' => 'Admin',
                    'last_name' => 'Owner',
                    'email' => 'admin-owner@example.test',
                    'phone' => '+1555000002',
                    'address' => [
                        'line1' => 'Main Street',
                        'city' => 'Austin',
                        'state' => 'Texas',
                        'postal_code' => '73301',
                        'country' => 'us',
                    ],
                ],
                [
                    'type' => 'tech',
                    'first_name' => 'Tech',
                    'last_name' => 'Owner',
                    'email' => 'tech-owner@example.test',
                    'phone' => '+1555000003',
                    'address' => [
                        'line1' => 'Main Street',
                        'city' => 'Austin',
                        'state' => 'Texas',
                        'postal_code' => '73301',
                        'country' => 'us',
                    ],
                ],
                [
                    'type' => 'billing',
                    'first_name' => 'Billing',
                    'last_name' => 'Owner',
                    'email' => 'billing-owner@example.test',
                    'phone' => '+1555000004',
                    'address' => [
                        'line1' => 'Main Street',
                        'city' => 'Austin',
                        'state' => 'Texas',
                        'postal_code' => '73301',
                        'country' => 'us',
                    ],
                ],
            ],
        ])->assertOk()
            ->assertJsonCount(4, 'data.contacts');
    }
}
