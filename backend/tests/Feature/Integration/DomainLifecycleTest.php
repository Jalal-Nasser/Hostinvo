<?php

namespace Tests\Feature\Integration;

use App\Models\Client;
use App\Models\Domain;
use App\Models\DomainRenewal;
use App\Models\RegistrarLog;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DomainLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_domain_register_renew_and_registrar_log_flow_with_tenant_isolation(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenantA = $this->createTenant('integration-domain-tenant-a');
        $tenantB = $this->createTenant('integration-domain-tenant-b');

        $tenantAdminA = $this->createTenantAdmin($tenantA, 'integration-domain-admin-a@example.test');

        $clientA = Client::query()->forceCreate([
            'tenant_id' => $tenantA->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Domain Lifecycle Client',
            'email' => 'domain-lifecycle-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $clientB = Client::query()->forceCreate([
            'tenant_id' => $tenantB->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Foreign Domain Client',
            'email' => 'foreign-domain-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        Sanctum::actingAs($tenantAdminA);

        $createDomainResponse = $this->postJson('/api/v1/admin/domains', [
            'client_id' => $clientA->id,
            'domain' => 'Integration-Domain.test',
            'tld' => '.test',
            'status' => Domain::STATUS_ACTIVE,
            'registrar' => 'Placeholder Registrar',
            'registration_date' => now()->toDateString(),
            'expiry_date' => now()->addYear()->toDateString(),
            'auto_renew' => true,
            'dns_management' => true,
            'id_protection' => true,
            'renewal_price' => 1299,
            'currency' => 'usd',
            'notes' => 'Integration domain registration flow.',
        ]);

        $domainId = $createDomainResponse->json('data.id');

        $createDomainResponse
            ->assertCreated()
            ->assertJsonPath('data.id', $domainId)
            ->assertJsonPath('data.domain', 'integration-domain.test')
            ->assertJsonPath('data.status', Domain::STATUS_ACTIVE);

        $this->putJson("/api/v1/admin/domains/{$domainId}/contacts", [
            'contacts' => [
                [
                    'type' => 'registrant',
                    'first_name' => 'Aisha',
                    'last_name' => 'Noor',
                    'email' => 'aisha.noor@example.test',
                    'phone' => '+1555000001',
                    'address' => [
                        'line1' => '100 Main Street',
                        'city' => 'Austin',
                        'state' => 'TX',
                        'postal_code' => '73301',
                        'country' => 'us',
                    ],
                ],
                [
                    'type' => 'admin',
                    'first_name' => 'Lina',
                    'last_name' => 'Khan',
                    'email' => 'lina.khan@example.test',
                    'phone' => '+1555000002',
                    'address' => [
                        'line1' => '100 Main Street',
                        'city' => 'Austin',
                        'state' => 'TX',
                        'postal_code' => '73301',
                        'country' => 'us',
                    ],
                ],
                [
                    'type' => 'tech',
                    'first_name' => 'Omar',
                    'last_name' => 'Saeed',
                    'email' => 'omar.saeed@example.test',
                    'phone' => '+1555000003',
                    'address' => [
                        'line1' => '100 Main Street',
                        'city' => 'Austin',
                        'state' => 'TX',
                        'postal_code' => '73301',
                        'country' => 'us',
                    ],
                ],
                [
                    'type' => 'billing',
                    'first_name' => 'Sara',
                    'last_name' => 'Ali',
                    'email' => 'sara.ali@example.test',
                    'phone' => '+1555000004',
                    'address' => [
                        'line1' => '100 Main Street',
                        'city' => 'Austin',
                        'state' => 'TX',
                        'postal_code' => '73301',
                        'country' => 'us',
                    ],
                ],
            ],
        ])->assertOk()
            ->assertJsonCount(4, 'data.contacts');

        $renewalResponse = $this->postJson("/api/v1/admin/domains/{$domainId}/renewals", [
            'years' => 1,
            'price' => 1399,
            'status' => DomainRenewal::STATUS_COMPLETED,
            'renewed_at' => now()->toDateString(),
        ]);

        $renewalResponse
            ->assertCreated()
            ->assertJsonPath('data.years', 1)
            ->assertJsonPath('data.status', DomainRenewal::STATUS_COMPLETED);

        $registrarLogResponse = $this->getJson("/api/v1/admin/domains/{$domainId}/registrar-logs");

        $registrarLogResponse
            ->assertOk()
            ->assertJsonFragment([
                'operation' => 'update_contacts',
                'status' => RegistrarLog::STATUS_SUCCESS,
            ])
            ->assertJsonFragment([
                'operation' => 'renew',
                'status' => RegistrarLog::STATUS_SUCCESS,
            ]);

        $foreignDomain = Domain::query()->create([
            'tenant_id' => $tenantB->id,
            'client_id' => $clientB->id,
            'domain' => 'foreign-domain.test',
            'tld' => 'test',
            'status' => Domain::STATUS_ACTIVE,
            'expiry_date' => now()->addYear()->toDateString(),
            'auto_renew' => true,
            'dns_management' => false,
            'id_protection' => false,
            'currency' => 'USD',
        ]);

        $this->getJson("/api/v1/admin/domains/{$foreignDomain->id}")
            ->assertNotFound();
    }

    private function createTenant(string $slug): Tenant
    {
        return Tenant::query()->create([
            'name' => str_replace('-', ' ', ucfirst($slug)),
            'slug' => $slug,
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);
    }

    private function createTenantAdmin(Tenant $tenant, string $email): User
    {
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => $email,
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

        return $user;
    }
}
