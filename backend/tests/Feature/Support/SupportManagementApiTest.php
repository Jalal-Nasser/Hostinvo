<?php

namespace Tests\Feature\Support;

use App\Models\Client;
use App\Models\ClientContact;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupportManagementApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_can_manage_support_departments_tickets_and_replies(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Acme Support',
            'slug' => 'acme-support',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'support-admin@acme.test',
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

        $client = Client::query()->create([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Example Hosting Client',
            'email' => 'billing@example-host.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $contact = ClientContact::query()->create([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'first_name' => 'Lina',
            'last_name' => 'Rahman',
            'email' => 'lina@example-host.test',
            'phone' => '+966500000000',
            'job_title' => 'Operations Manager',
            'is_primary' => true,
        ]);

        Sanctum::actingAs($user);

        $statusResponse = $this->getJson('/api/v1/admin/ticket-statuses');
        $statusResponse
            ->assertOk()
            ->assertJsonCount(6, 'data');

        $departmentResponse = $this->getJson('/api/v1/admin/ticket-departments?per_page=100');
        $departmentResponse
            ->assertOk()
            ->assertJsonCount(3, 'data');

        $newDepartmentResponse = $this->postJson('/api/v1/admin/ticket-departments', [
            'name' => 'Escalations',
            'description' => 'Escalated support cases.',
            'is_active' => true,
            'display_order' => 90,
        ]);

        $newDepartmentId = $newDepartmentResponse->json('data.id');

        $newDepartmentResponse
            ->assertCreated()
            ->assertJsonPath('data.name', 'Escalations');

        $this->putJson("/api/v1/admin/ticket-departments/{$newDepartmentId}", [
            'description' => 'Priority escalated support cases.',
            'display_order' => 95,
        ])->assertOk()
            ->assertJsonPath('data.display_order', 95);

        $ticketResponse = $this->postJson('/api/v1/admin/tickets', [
            'client_id' => $client->id,
            'client_contact_id' => $contact->id,
            'department_id' => $newDepartmentId,
            'subject' => 'Primary domain is not resolving',
            'priority' => 'high',
            'message' => 'The client reports intermittent DNS issues on the production domain.',
        ]);

        $ticketId = $ticketResponse->json('data.id');

        $ticketResponse
            ->assertCreated()
            ->assertJsonPath('data.client_id', $client->id)
            ->assertJsonPath('data.department_id', $newDepartmentId)
            ->assertJsonPath('data.replies.0.message', 'The client reports intermittent DNS issues on the production domain.');

        $replyResponse = $this->postJson("/api/v1/admin/tickets/{$ticketId}/replies", [
            'message' => 'We are checking the zone configuration now.',
        ]);

        $replyResponse
            ->assertOk()
            ->assertJsonPath('data.replies.1.reply_type', 'admin')
            ->assertJsonPath('data.status.code', 'answered');

        $internalNoteResponse = $this->postJson("/api/v1/admin/tickets/{$ticketId}/replies", [
            'is_internal' => true,
            'message' => 'Investigate whether the last DNS sync job failed on the cluster.',
        ]);

        $internalNoteResponse
            ->assertOk()
            ->assertJsonPath('data.replies.2.reply_type', 'internal_note')
            ->assertJsonPath('data.replies.2.is_internal', true);

        $closedStatusId = collect($statusResponse->json('data'))
            ->firstWhere('code', 'closed')['id'];

        $this->putJson("/api/v1/admin/tickets/{$ticketId}", [
            'status_id' => $closedStatusId,
            'priority' => 'urgent',
        ])->assertOk()
            ->assertJsonPath('data.status.code', 'closed')
            ->assertJsonPath('data.priority', 'urgent');

        $this->getJson('/api/v1/admin/support/overview')
            ->assertOk()
            ->assertJsonPath('data.stats.total', 1)
            ->assertJsonPath('data.stats.closed', 1);

        $this->deleteJson("/api/v1/admin/tickets/{$ticketId}")
            ->assertNoContent();

        $this->assertSoftDeleted('tickets', [
            'id' => $ticketId,
        ]);
    }
}
