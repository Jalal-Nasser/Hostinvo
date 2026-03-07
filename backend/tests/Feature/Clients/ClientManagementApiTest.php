<?php

namespace Tests\Feature\Clients;

use App\Models\Client;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClientManagementApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_can_create_update_and_archive_a_client(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Acme Hosting',
            'slug' => 'acme-hosting',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'admin@acme.test',
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

        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/v1/admin/clients', [
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Example Corp',
            'email' => 'billing@example.test',
            'phone' => '+966500000000',
            'country' => 'sa',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'ar',
            'currency' => 'sar',
            'notes' => 'Primary hosting client.',
            'contacts' => [
                [
                    'first_name' => 'Aisha',
                    'last_name' => 'Khan',
                    'email' => 'aisha@example.test',
                    'phone' => '+966500000001',
                    'job_title' => 'Operations Manager',
                    'is_primary' => true,
                ],
            ],
            'addresses' => [
                [
                    'type' => 'billing',
                    'line_1' => 'King Fahd Road',
                    'city' => 'Riyadh',
                    'state' => 'Riyadh',
                    'postal_code' => '12211',
                    'country' => 'sa',
                    'is_primary' => true,
                ],
            ],
        ]);

        $clientId = $createResponse->json('data.id');

        $createResponse
            ->assertCreated()
            ->assertJsonPath('data.tenant_id', $tenant->id)
            ->assertJsonPath('data.company_name', 'Example Corp')
            ->assertJsonPath('data.contacts.0.email', 'aisha@example.test')
            ->assertJsonPath('data.addresses.0.country', 'SA');

        $updateResponse = $this->putJson("/api/v1/admin/clients/{$clientId}", [
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Example Corp Holdings',
            'email' => 'accounts@example.test',
            'phone' => '+966500000009',
            'country' => 'AE',
            'status' => Client::STATUS_INACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'usd',
            'notes' => 'Moved under finance review.',
            'contacts' => [
                [
                    'id' => $createResponse->json('data.contacts.0.id'),
                    'first_name' => 'Aisha',
                    'last_name' => 'Khan',
                    'email' => 'aisha@example.test',
                    'phone' => '+966500000002',
                    'job_title' => 'Finance Lead',
                    'is_primary' => true,
                ],
            ],
            'addresses' => [
                [
                    'id' => $createResponse->json('data.addresses.0.id'),
                    'type' => 'billing',
                    'line_1' => 'Sheikh Zayed Road',
                    'city' => 'Dubai',
                    'state' => 'Dubai',
                    'postal_code' => '00000',
                    'country' => 'ae',
                    'is_primary' => true,
                ],
            ],
        ]);

        $updateResponse
            ->assertOk()
            ->assertJsonPath('data.company_name', 'Example Corp Holdings')
            ->assertJsonPath('data.status', Client::STATUS_INACTIVE)
            ->assertJsonPath('data.currency', 'USD')
            ->assertJsonFragment([
                'action' => 'client.updated',
            ]);

        $this->getJson('/api/v1/admin/clients')
            ->assertOk()
            ->assertJsonPath('data.0.id', $clientId);

        $this->deleteJson("/api/v1/admin/clients/{$clientId}")
            ->assertNoContent();

        $this->assertSoftDeleted('clients', [
            'id' => $clientId,
        ]);
    }
}
