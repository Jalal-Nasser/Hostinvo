<?php

namespace Tests\Feature\Billing;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InvoiceTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_invoice_routes_do_not_allow_cross_tenant_access(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenantA = Tenant::query()->create([
            'name' => 'Tenant A Billing',
            'slug' => 'tenant-a-billing',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $tenantB = Tenant::query()->create([
            'name' => 'Tenant B Billing',
            'slug' => 'tenant-b-billing',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenantA->id,
            'email' => 'tenant-a-billing-admin@example.test',
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

        $client = Client::query()->forceCreate([
            'tenant_id' => $tenantB->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Foreign Billing Client',
            'email' => 'foreign-billing-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $invoice = Invoice::query()->forceCreate([
            'tenant_id' => $tenantB->id,
            'client_id' => $client->id,
            'reference_number' => 'INV-FOREIGN-001',
            'status' => Invoice::STATUS_UNPAID,
            'currency' => 'USD',
            'issue_date' => '2026-03-08',
            'due_date' => '2026-03-15',
            'discount_value' => 0,
            'discount_amount_minor' => 0,
            'credit_applied_minor' => 0,
            'tax_rate_bps' => 0,
            'tax_amount_minor' => 0,
            'subtotal_minor' => 500,
            'total_minor' => 500,
            'amount_paid_minor' => 0,
            'refunded_amount_minor' => 0,
            'balance_due_minor' => 500,
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/v1/admin/invoices/{$invoice->id}")
            ->assertForbidden();

        $this->postJson("/api/v1/admin/invoices/{$invoice->id}/payments", [
            'payment_method' => 'manual',
            'amount_minor' => 100,
        ])->assertNotFound();
    }
}
