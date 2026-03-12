<?php

namespace Tests\Feature\Integration;

use App\Models\Client;
use Laravel\Sanctum\Sanctum;

class ClientLifecycleTest extends IntegrationTestCase
{
    public function test_client_lifecycle_create_update_delete_and_tenant_isolation(): void
    {
        $tenantA = $this->createTenant('integration-client-tenant-a');
        $tenantB = $this->createTenant('integration-client-tenant-b');

        $tenantAdminA = $this->createTenantAdmin($tenantA, 'integration-client-admin-a@example.test');

        Sanctum::actingAs($tenantAdminA);

        $createResponse = $this->postJson('/api/v1/admin/clients', [
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Lifecycle Client LLC',
            'email' => 'lifecycle-client@example.test',
            'phone' => '+1555000001',
            'country' => 'us',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'usd',
            'notes' => 'Integration lifecycle test client.',
            'contacts' => [
                [
                    'first_name' => 'Nora',
                    'last_name' => 'Ali',
                    'email' => 'nora.ali@example.test',
                    'phone' => '+1555000002',
                    'job_title' => 'Operations Lead',
                    'is_primary' => true,
                ],
            ],
            'addresses' => [
                [
                    'type' => 'billing',
                    'line_1' => '101 Integration Street',
                    'city' => 'Austin',
                    'state' => 'TX',
                    'postal_code' => '73301',
                    'country' => 'us',
                    'is_primary' => true,
                ],
            ],
        ]);

        $clientId = $createResponse->json('data.id');

        $createResponse
            ->assertCreated()
            ->assertJsonPath('data.id', $clientId)
            ->assertJsonPath('data.tenant_id', $tenantA->id)
            ->assertJsonPath('data.contacts.0.email', 'nora.ali@example.test');

        $this->putJson("/api/v1/admin/clients/{$clientId}", [
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Lifecycle Client Holdings',
            'email' => 'updated-client@example.test',
            'phone' => '+1555000009',
            'country' => 'US',
            'status' => Client::STATUS_INACTIVE,
            'preferred_locale' => 'ar',
            'currency' => 'usd',
            'notes' => 'Integration lifecycle test client updated.',
            'contacts' => [
                [
                    'id' => $createResponse->json('data.contacts.0.id'),
                    'first_name' => 'Nora',
                    'last_name' => 'Ali',
                    'email' => 'nora.ali@example.test',
                    'phone' => '+1555000010',
                    'job_title' => 'Finance Lead',
                    'is_primary' => true,
                ],
            ],
            'addresses' => [
                [
                    'id' => $createResponse->json('data.addresses.0.id'),
                    'type' => 'billing',
                    'line_1' => '202 Update Avenue',
                    'city' => 'Dallas',
                    'state' => 'TX',
                    'postal_code' => '75001',
                    'country' => 'us',
                    'is_primary' => true,
                ],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.company_name', 'Lifecycle Client Holdings')
            ->assertJsonPath('data.status', Client::STATUS_INACTIVE)
            ->assertJsonPath('data.preferred_locale', 'ar');

        $foreignClient = Client::query()->forceCreate([
            'tenant_id' => $tenantB->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Foreign Tenant Client',
            'email' => 'foreign-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $this->getJson("/api/v1/admin/clients/{$foreignClient->id}")
            ->assertNotFound();

        $this->deleteJson("/api/v1/admin/clients/{$clientId}")
            ->assertNoContent();

        $this->assertSoftDeleted('clients', [
            'id' => $clientId,
        ]);
    }
}
