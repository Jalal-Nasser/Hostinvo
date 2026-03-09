<?php

namespace Tests\Feature\Support;

use App\Models\Client;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\Ticket;
use App\Models\TicketDepartment;
use App\Models\TicketStatus;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupportTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_routes_do_not_allow_cross_tenant_access(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenantA = Tenant::query()->create([
            'name' => 'Tenant A Support',
            'slug' => 'tenant-a-support',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $tenantB = Tenant::query()->create([
            'name' => 'Tenant B Support',
            'slug' => 'tenant-b-support',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenantA->id,
            'email' => 'tenant-a-support-admin@example.test',
        ]);

        $role = Role::query()->where('name', Role::TENANT_ADMIN)->firstOrFail();
        $user->roles()->attach($role);

        TenantUser::query()->forceCreate([
            'tenant_id' => $tenantA->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        $department = TicketDepartment::query()->create([
            'tenant_id' => $tenantB->id,
            'name' => 'Foreign Department',
            'slug' => 'foreign-department',
            'description' => 'Foreign tenant department.',
            'is_active' => true,
            'display_order' => 10,
        ]);

        $status = TicketStatus::query()->create([
            'tenant_id' => $tenantB->id,
            'name' => 'Open',
            'code' => 'open',
            'color' => 'amber',
            'is_default' => true,
            'is_closed' => false,
            'display_order' => 10,
        ]);

        $client = Client::query()->create([
            'tenant_id' => $tenantB->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Foreign Client',
            'email' => 'foreign-support@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $ticket = Ticket::query()->create([
            'tenant_id' => $tenantB->id,
            'department_id' => $department->id,
            'status_id' => $status->id,
            'client_id' => $client->id,
            'ticket_number' => 'TKT-FOREIGN-001',
            'subject' => 'Foreign tenant issue',
            'priority' => Ticket::PRIORITY_MEDIUM,
            'source' => Ticket::SOURCE_ADMIN,
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/v1/admin/tickets/{$ticket->id}")
            ->assertForbidden();
    }
}
