<?php

namespace Tests\Feature\Domains;

use App\Models\Client;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DomainManagementApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_can_manage_domains_contacts_and_renewals(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Acme Domains',
            'slug' => 'acme-domains',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'admin@acme-domains.test',
        ]);

        $role = Role::query()->where('name', Role::TENANT_ADMIN)->firstOrFail();
        $user->roles()->attach($role);

        TenantUser::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        $client = Client::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Example Registrar Client',
            'email' => 'domains@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/v1/admin/domains', [
            'client_id' => $client->id,
            'domain' => 'Example.COM',
            'tld' => '.com',
            'status' => 'active',
            'registrar' => 'Manual Registrar',
            'registration_date' => '2026-01-10',
            'expiry_date' => '2027-01-10',
            'auto_renew' => true,
            'dns_management' => true,
            'id_protection' => false,
            'renewal_price' => 1499,
            'currency' => 'usd',
            'notes' => 'Primary production domain.',
        ]);

        $domainId = $createResponse->json('data.id');

        $createResponse
            ->assertCreated()
            ->assertJsonPath('data.domain', 'example.com')
            ->assertJsonPath('data.tld', 'com')
            ->assertJsonPath('data.currency', 'USD');

        $this->putJson("/api/v1/admin/domains/{$domainId}", [
            'client_id' => $client->id,
            'domain' => 'example.com',
            'tld' => 'com',
            'status' => 'pending_transfer',
            'registrar' => 'Updated Registrar',
            'registration_date' => '2026-01-10',
            'expiry_date' => '2027-02-10',
            'auto_renew' => false,
            'dns_management' => true,
            'id_protection' => true,
            'renewal_price' => 1999,
            'currency' => 'eur',
            'notes' => 'Updated lifecycle state.',
        ])->assertOk()
            ->assertJsonPath('data.status', 'pending_transfer')
            ->assertJsonPath('data.id_protection', true)
            ->assertJsonPath('data.currency', 'EUR');

        $contactsResponse = $this->putJson("/api/v1/admin/domains/{$domainId}/contacts", [
            'contacts' => [
                [
                    'type' => 'registrant',
                    'first_name' => 'Aisha',
                    'last_name' => 'Khan',
                    'email' => 'aisha@example.test',
                    'phone' => '+966500000000',
                    'address' => [
                        'line1' => 'King Fahd Road',
                        'city' => 'Riyadh',
                        'state' => 'Riyadh',
                        'postal_code' => '12211',
                        'country' => 'sa',
                    ],
                ],
                [
                    'type' => 'admin',
                    'first_name' => 'Lina',
                    'last_name' => 'Rahman',
                    'email' => 'lina@example.test',
                    'phone' => '+966500000001',
                    'address' => [
                        'line1' => 'Olaya Street',
                        'city' => 'Riyadh',
                        'state' => 'Riyadh',
                        'postal_code' => '12212',
                        'country' => 'sa',
                    ],
                ],
                [
                    'type' => 'tech',
                    'first_name' => 'Omar',
                    'last_name' => 'Saeed',
                    'email' => 'omar@example.test',
                    'phone' => '+966500000002',
                    'address' => [
                        'line1' => 'Tahlia Street',
                        'city' => 'Jeddah',
                        'state' => 'Makkah',
                        'postal_code' => '21411',
                        'country' => 'sa',
                    ],
                ],
                [
                    'type' => 'billing',
                    'first_name' => 'Sara',
                    'last_name' => 'Noor',
                    'email' => 'sara@example.test',
                    'phone' => '+966500000003',
                    'address' => [
                        'line1' => 'Corniche Road',
                        'city' => 'Dammam',
                        'state' => 'Eastern',
                        'postal_code' => '31411',
                        'country' => 'sa',
                    ],
                ],
            ],
        ]);

        $contactsResponse
            ->assertOk()
            ->assertJsonPath('data.contacts.0.type', 'admin');

        $renewalResponse = $this->postJson("/api/v1/admin/domains/{$domainId}/renewals", [
            'years' => 2,
            'price' => 2499,
            'status' => 'completed',
            'renewed_at' => '2026-03-01',
        ]);

        $renewalResponse
            ->assertCreated()
            ->assertJsonPath('data.years', 2)
            ->assertJsonPath('data.price', 2499);

        $this->getJson("/api/v1/admin/domains/{$domainId}")
            ->assertOk()
            ->assertJsonCount(4, 'data.contacts')
            ->assertJsonCount(2, 'data.registrar_logs');

        $this->deleteJson("/api/v1/admin/domains/{$domainId}")
            ->assertNoContent();

        $this->assertSoftDeleted('domains', [
            'id' => $domainId,
        ]);
    }
}
