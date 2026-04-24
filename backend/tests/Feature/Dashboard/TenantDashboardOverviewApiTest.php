<?php

namespace Tests\Feature\Dashboard;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\License;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ProvisioningJob;
use App\Models\Product;
use App\Models\Role;
use App\Models\Server;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\Ticket;
use App\Models\TicketStatus;
use App\Models\Transaction;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantDashboardOverviewApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_dashboard_overview_returns_real_aggregates(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Dashboard Tenant',
            'slug' => 'dashboard-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        License::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'license_key' => 'HOST-DASHBOARD-001',
            'owner_email' => 'owner@dashboard.test',
            'type' => License::PLAN_PROFESSIONAL,
            'plan' => License::PLAN_PROFESSIONAL,
            'license_type' => License::PLAN_PROFESSIONAL,
            'status' => License::STATUS_ACTIVE,
            'max_clients' => 500,
            'max_services' => 500,
            'activation_limit' => 2,
            'issued_at' => now(),
            'expires_at' => now()->addYear(),
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'dashboard-admin@example.test',
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

        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Dashboard Client',
            'email' => 'client@dashboard.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $ticketStatus = TicketStatus::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Open',
            'code' => TicketStatus::CODE_OPEN,
            'color' => 'amber',
            'is_default' => true,
            'is_closed' => false,
            'display_order' => 10,
        ]);

        Ticket::query()->create([
            'tenant_id' => $tenant->id,
            'status_id' => $ticketStatus->id,
            'department_id' => null,
            'client_id' => $client->id,
            'client_contact_id' => null,
            'opened_by_user_id' => $user->id,
            'assigned_to_user_id' => null,
            'service_id' => null,
            'ticket_number' => 'TKT-0001',
            'subject' => 'Dashboard test ticket',
            'priority' => Ticket::PRIORITY_MEDIUM,
            'source' => Ticket::SOURCE_ADMIN,
            'status' => TicketStatus::CODE_OPEN,
        ]);

        Order::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'user_id' => $user->id,
            'reference_number' => 'ORD-DASH-001',
            'status' => Order::STATUS_PENDING,
            'currency' => 'USD',
            'discount_value' => 0,
            'discount_amount_minor' => 0,
            'tax_rate_bps' => 0,
            'tax_amount_minor' => 0,
            'subtotal_minor' => 2500,
            'total_minor' => 2500,
            'placed_at' => now(),
        ]);

        $product = Product::query()->create([
            'tenant_id' => $tenant->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Dashboard Hosting',
            'slug' => 'dashboard-hosting',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_PUBLIC,
            'display_order' => 0,
            'is_featured' => false,
        ]);

        $server = Server::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'name' => 'Primary cPanel',
            'hostname' => 'vmi.dashboard.test',
            'panel_type' => Server::PANEL_CPANEL,
            'api_endpoint' => 'https://vmi.dashboard.test:2087',
            'status' => Server::STATUS_ACTIVE,
            'username' => 'root',
            'ip_address' => '192.0.2.10',
            'max_accounts' => 100,
            'account_count' => 1,
            'last_tested_at' => now(),
            'credentials' => [
                'username' => 'root',
                'api_token' => 'token-value',
            ],
        ]);

        $service = Service::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'product_id' => $product->id,
            'user_id' => $user->id,
            'server_id' => $server->id,
            'reference_number' => 'SRV-DASH-001',
            'service_type' => Service::TYPE_HOSTING,
            'billing_cycle' => 'monthly',
            'price' => 2500,
            'currency' => 'USD',
            'domain' => 'example.test',
            'termination_date' => now()->addWeek()->toDateString(),
            'status' => Service::STATUS_ACTIVE,
            'provisioning_state' => Service::PROVISIONING_SYNCED,
            'activated_at' => now(),
        ]);

        ProvisioningJob::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'service_id' => $service->id,
            'server_id' => $server->id,
            'requested_by_user_id' => $user->id,
            'operation' => ProvisioningJob::OPERATION_SUSPEND_ACCOUNT,
            'status' => ProvisioningJob::STATUS_QUEUED,
            'driver' => 'cpanel',
            'queue_name' => 'default',
            'attempts' => 0,
            'requested_at' => now(),
        ]);

        $invoice = Invoice::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'user_id' => $user->id,
            'reference_number' => 'INV-DASH-001',
            'status' => Invoice::STATUS_PAID,
            'currency' => 'USD',
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addWeek()->toDateString(),
            'subtotal_minor' => 2500,
            'total_minor' => 2500,
            'amount_paid_minor' => 2500,
            'balance_due_minor' => 0,
            'paid_at' => now(),
        ]);

        $payment = Payment::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'invoice_id' => $invoice->id,
            'client_id' => $client->id,
            'user_id' => $user->id,
            'type' => Payment::TYPE_PAYMENT,
            'status' => Payment::STATUS_COMPLETED,
            'payment_method' => 'paypal',
            'currency' => 'USD',
            'amount_minor' => 2500,
            'reference' => 'PAY-DASH-001',
            'paid_at' => now(),
        ]);

        Transaction::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'payment_id' => $payment->id,
            'invoice_id' => $invoice->id,
            'client_id' => $client->id,
            'type' => Transaction::TYPE_PAYMENT,
            'status' => Transaction::STATUS_COMPLETED,
            'gateway' => 'paypal',
            'external_reference' => 'CAPTURE-DASH-001',
            'currency' => 'USD',
            'amount_minor' => 2500,
            'occurred_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/admin/dashboard/overview');

        $response
            ->assertOk()
            ->assertJsonPath('data.tenant.currency', 'USD')
            ->assertJsonPath('data.counters.pending_orders', 1)
            ->assertJsonPath('data.counters.tickets_waiting', 1)
            ->assertJsonPath('data.counters.pending_cancellations', 1)
            ->assertJsonPath('data.counters.pending_module_actions', 1)
            ->assertJsonPath('data.billing.today_minor', 2500)
            ->assertJsonPath('data.billing.this_month_minor', 2500)
            ->assertJsonPath('data.billing.this_year_minor', 2500)
            ->assertJsonPath('data.billing.all_time_minor', 2500)
            ->assertJsonPath('data.automation.invoices_created_today', 1)
            ->assertJsonPath('data.automation.credit_card_captures_today', 1)
            ->assertJsonPath('data.support.awaiting_reply', 1)
            ->assertJsonPath('data.support.assigned_to_you', 0)
            ->assertJsonPath('data.client_activity.active_clients', 1)
            ->assertJsonPath('data.servers.connected_total', 1)
            ->assertJsonPath('data.servers.active_total', 1)
            ->assertJsonPath('data.servers.items.0.name', 'Primary cPanel')
            ->assertJsonPath('data.system_health.rating', 'warning')
            ->assertJsonPath('data.system_health.warnings', 1)
            ->assertJsonPath('data.system_health.needs_attention', 0)
            ->assertJsonPath('data.chart.series.last_30_days.29.new_orders', 1)
            ->assertJsonPath('data.chart.series.last_30_days.29.activated_orders', 1)
            ->assertJsonPath('data.chart.series.last_30_days.29.income_minor', 2500);
    }
}
