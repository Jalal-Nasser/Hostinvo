<?php

namespace Tests\Feature\Integration;

use App\Models\Client;
use App\Models\ClientContact;
use App\Models\Ticket;
use App\Models\TicketDepartment;
use App\Models\TicketReply;
use App\Models\TicketStatus;
use Laravel\Sanctum\Sanctum;

class TicketLifecycleTest extends IntegrationTestCase
{
    public function test_ticket_create_reply_status_change_and_tenant_isolation(): void
    {
        $tenantA = $this->createTenant('integration-ticket-tenant-a');
        $tenantB = $this->createTenant('integration-ticket-tenant-b');

        $tenantAdminA = $this->createTenantAdmin($tenantA, 'integration-ticket-admin-a@example.test');

        $clientA = Client::query()->forceCreate([
            'tenant_id' => $tenantA->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Ticket Lifecycle Client',
            'email' => 'ticket-lifecycle-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $contactA = ClientContact::query()->create([
            'tenant_id' => $tenantA->id,
            'client_id' => $clientA->id,
            'first_name' => 'Yara',
            'last_name' => 'Ibrahim',
            'email' => 'yara.ibrahim@example.test',
            'phone' => '+1555000001',
            'job_title' => 'Account Owner',
            'is_primary' => true,
        ]);

        Sanctum::actingAs($tenantAdminA);

        $departmentResponse = $this->getJson('/api/v1/admin/ticket-departments?per_page=100')
            ->assertOk();

        $statusResponse = $this->getJson('/api/v1/admin/ticket-statuses')
            ->assertOk();

        $departmentId = $departmentResponse->json('data.0.id');
        $closedStatusId = collect($statusResponse->json('data'))->firstWhere('code', TicketStatus::CODE_CLOSED)['id'];

        $createTicketResponse = $this->postJson('/api/v1/admin/tickets', [
            'client_id' => $clientA->id,
            'client_contact_id' => $contactA->id,
            'department_id' => $departmentId,
            'subject' => 'Integration ticket lifecycle issue',
            'priority' => Ticket::PRIORITY_HIGH,
            'message' => 'Initial ticket message for integration lifecycle testing.',
        ]);

        $ticketId = $createTicketResponse->json('data.id');

        $createTicketResponse
            ->assertCreated()
            ->assertJsonPath('data.id', $ticketId)
            ->assertJsonPath('data.client_id', $clientA->id)
            ->assertJsonPath('data.replies.0.reply_type', TicketReply::TYPE_ADMIN);

        $this->postJson("/api/v1/admin/tickets/{$ticketId}/replies", [
            'message' => 'Admin follow-up on integration ticket lifecycle.',
        ])->assertOk()
            ->assertJsonPath('data.id', $ticketId)
            ->assertJsonPath('data.replies.1.reply_type', TicketReply::TYPE_ADMIN);

        $this->putJson("/api/v1/admin/tickets/{$ticketId}", [
            'status_id' => $closedStatusId,
            'priority' => Ticket::PRIORITY_URGENT,
        ])->assertOk()
            ->assertJsonPath('data.status.code', TicketStatus::CODE_CLOSED)
            ->assertJsonPath('data.priority', Ticket::PRIORITY_URGENT);

        $this->getJson("/api/v1/admin/tickets/{$ticketId}")
            ->assertOk()
            ->assertJsonPath('data.status.code', TicketStatus::CODE_CLOSED)
            ->assertJsonPath('data.replies.1.message', 'Admin follow-up on integration ticket lifecycle.');

        $foreignClient = Client::query()->forceCreate([
            'tenant_id' => $tenantB->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Foreign Ticket Client',
            'email' => 'foreign-ticket-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $foreignDepartment = TicketDepartment::query()->create([
            'tenant_id' => $tenantB->id,
            'name' => 'Foreign Support',
            'slug' => 'foreign-support',
            'description' => 'Foreign tenant support department.',
            'is_active' => true,
            'display_order' => 1,
        ]);

        $foreignStatus = TicketStatus::query()->create([
            'tenant_id' => $tenantB->id,
            'name' => 'Open',
            'code' => TicketStatus::CODE_OPEN,
            'color' => 'amber',
            'is_default' => true,
            'is_closed' => false,
            'display_order' => 1,
        ]);

        $foreignTicket = Ticket::query()->create([
            'tenant_id' => $tenantB->id,
            'department_id' => $foreignDepartment->id,
            'status_id' => $foreignStatus->id,
            'client_id' => $foreignClient->id,
            'ticket_number' => 'TKT-FOREIGN-INTEGRATION-001',
            'subject' => 'Foreign tenant ticket',
            'priority' => Ticket::PRIORITY_MEDIUM,
            'source' => Ticket::SOURCE_ADMIN,
        ]);

        $this->getJson("/api/v1/admin/tickets/{$foreignTicket->id}")
            ->assertNotFound();
    }
}
