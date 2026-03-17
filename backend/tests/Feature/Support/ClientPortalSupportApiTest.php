<?php

namespace Tests\Feature\Support;

use App\Models\Client;
use App\Models\License;
use App\Models\Product;
use App\Models\Role;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClientPortalSupportApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_can_list_only_own_tickets(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = $this->createTenant('portal-support-list');
        [$portalUserA, $clientA] = $this->createPortalUserWithClient($tenant, 'client-a@example.test', 'Client A');
        [$portalUserB] = $this->createPortalUserWithClient($tenant, 'client-b@example.test', 'Client B');

        Sanctum::actingAs($portalUserA);
        $ticketA = $this->postJson('/api/v1/client/tickets', [
            'subject' => 'Ticket from client A',
            'priority' => 'medium',
            'message' => 'Client A initial message.',
        ])->assertCreated()->json('data');

        Sanctum::actingAs($portalUserB);
        $this->postJson('/api/v1/client/tickets', [
            'subject' => 'Ticket from client B',
            'priority' => 'medium',
            'message' => 'Client B initial message.',
        ])->assertCreated();

        Sanctum::actingAs($portalUserA);
        $this->getJson('/api/v1/client/tickets')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ticketA['id'])
            ->assertJsonPath('data.0.client_id', $clientA->id);
    }

    public function test_client_cannot_access_another_clients_ticket(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = $this->createTenant('portal-support-show');
        [$portalUserA] = $this->createPortalUserWithClient($tenant, 'portal-a@example.test', 'Portal A');
        [$portalUserB] = $this->createPortalUserWithClient($tenant, 'portal-b@example.test', 'Portal B');

        Sanctum::actingAs($portalUserB);
        $ticketId = $this->postJson('/api/v1/client/tickets', [
            'subject' => 'Ticket owned by user B',
            'priority' => 'high',
            'message' => 'Owned by B.',
        ])->assertCreated()->json('data.id');

        Sanctum::actingAs($portalUserA);
        $this->getJson("/api/v1/client/tickets/{$ticketId}")
            ->assertForbidden();
    }

    public function test_client_can_create_ticket_and_reply_to_own_ticket(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = $this->createTenant('portal-support-create-reply');
        [$portalUser, $client] = $this->createPortalUserWithClient($tenant, 'portal-create@example.test', 'Portal Create');

        Sanctum::actingAs($portalUser);

        $ticketId = $this->postJson('/api/v1/client/tickets', [
            'subject' => 'Need help with SSL renewal',
            'priority' => 'urgent',
            'message' => 'The certificate did not renew automatically.',
        ])->assertCreated()
            ->assertJsonPath('data.client_id', $client->id)
            ->assertJsonPath('data.source', 'portal')
            ->json('data.id');

        $this->postJson("/api/v1/client/tickets/{$ticketId}/replies", [
            'message' => 'Please prioritize, this is customer facing.',
        ])->assertOk()
            ->assertJsonPath('data.replies.1.reply_type', 'client')
            ->assertJsonPath('data.replies.1.is_internal', false);
    }

    public function test_service_linked_ticket_creation_validates_service_ownership(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = $this->createTenant('portal-support-services');
        [$portalUserA, $clientA] = $this->createPortalUserWithClient($tenant, 'portal-service-a@example.test', 'Portal Service A');
        [, $clientB] = $this->createPortalUserWithClient($tenant, 'portal-service-b@example.test', 'Portal Service B');

        $product = Product::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'type' => 'hosting',
            'name' => 'Portal Hosting Plan',
            'slug' => 'portal-hosting-plan',
            'status' => 'active',
            'visibility' => 'public',
            'display_order' => 0,
            'is_featured' => false,
        ]);

        $serviceA = $this->createService($tenant, $clientA, $portalUserA, $product, 'SRV-PORTAL-A');
        $serviceB = $this->createService($tenant, $clientB, null, $product, 'SRV-PORTAL-B');

        Sanctum::actingAs($portalUserA);

        $this->postJson('/api/v1/client/tickets', [
            'service_id' => $serviceB->id,
            'subject' => 'Attempt with foreign service',
            'priority' => 'medium',
            'message' => 'Should fail validation.',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['service_id']);

        $this->postJson('/api/v1/client/tickets', [
            'service_id' => $serviceA->id,
            'subject' => 'Issue with my own service',
            'priority' => 'high',
            'message' => 'This should be accepted.',
        ])->assertCreated()
            ->assertJsonPath('data.service_id', $serviceA->id);
    }

    public function test_internal_notes_cannot_be_created_from_client_portal(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = $this->createTenant('portal-support-internal-note');
        [$portalUser] = $this->createPortalUserWithClient($tenant, 'portal-internal@example.test', 'Portal Internal');

        Sanctum::actingAs($portalUser);

        $ticketId = $this->postJson('/api/v1/client/tickets', [
            'subject' => 'Internal note protection check',
            'priority' => 'medium',
            'message' => 'Ticket body.',
        ])->assertCreated()
            ->json('data.id');

        $this->postJson("/api/v1/client/tickets/{$ticketId}/replies", [
            'message' => 'This should not become an internal note.',
            'is_internal' => true,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['is_internal']);

        $this->assertDatabaseMissing('ticket_replies', [
            'ticket_id' => $ticketId,
            'is_internal' => true,
        ]);
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

    private function createService(
        Tenant $tenant,
        Client $client,
        ?User $owner,
        Product $product,
        string $referenceNumber
    ): Service {
        return Service::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'product_id' => $product->id,
            'user_id' => $owner?->id,
            'reference_number' => $referenceNumber,
            'service_type' => Service::TYPE_HOSTING,
            'status' => Service::STATUS_ACTIVE,
            'provisioning_state' => Service::PROVISIONING_IDLE,
            'billing_cycle' => 'monthly',
            'price' => 500,
            'currency' => 'USD',
            'domain' => strtolower($referenceNumber) . '.example.test',
        ]);
    }
}
