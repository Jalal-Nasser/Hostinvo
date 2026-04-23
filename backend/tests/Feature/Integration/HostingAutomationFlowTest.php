<?php

namespace Tests\Feature\Integration;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\License;
use App\Models\Order;
use App\Models\ProductPricing;
use App\Models\Role;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HostingAutomationFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_paid_order_creates_invoice_and_hosting_service(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Automation Tenant',
            'slug' => 'automation-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'automation-admin@example.test',
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

        License::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'license_key' => 'HOST-AUTOMATION-001',
            'owner_email' => 'owner@automation.test',
            'type' => License::PLAN_PROFESSIONAL,
            'plan' => License::PLAN_PROFESSIONAL,
            'license_type' => License::PLAN_PROFESSIONAL,
            'status' => License::STATUS_ACTIVE,
            'max_clients' => 250,
            'max_services' => 250,
            'activation_limit' => 1,
            'issued_at' => now(),
            'expires_at' => now()->addYear(),
        ]);

        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Automation Client',
            'email' => 'client@automation.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        Sanctum::actingAs($user);

        $serverResponse = $this->postJson('/api/v1/admin/servers', [
            'name' => 'Custom Node',
            'hostname' => 'custom-node.example.test',
            'ip_address' => '192.0.2.10',
            'panel_type' => 'custom',
            'api_endpoint' => 'https://custom-node.example.test/api',
            'api_port' => 443,
            'status' => 'active',
            'verify_ssl' => true,
            'max_accounts' => 50,
            'credentials' => [
                'api_token' => 'secret-token',
            ],
        ]);

        $serverResponse->assertCreated()
            ->assertJsonPath('data.hostname', 'custom-node.example.test')
            ->assertJsonPath('data.ip_address', '192.0.2.10');

        $serverId = $serverResponse->json('data.id');

        $productResponse = $this->postJson('/api/v1/admin/products', [
            'server_id' => $serverId,
            'type' => 'hosting',
            'provisioning_module' => 'custom',
            'provisioning_package' => 'custom-basic',
            'name' => 'Automation Hosting',
            'slug' => 'automation-hosting',
            'status' => 'active',
            'visibility' => 'public',
            'display_order' => 1,
            'is_featured' => false,
        ]);

        $productResponse->assertCreated()
            ->assertJsonPath('data.server.id', $serverId)
            ->assertJsonPath('data.provisioning_module', 'custom');

        $productId = $productResponse->json('data.id');

        $this->assertDatabaseHas('server_packages', [
            'tenant_id' => $tenant->id,
            'server_id' => $serverId,
            'product_id' => $productId,
            'panel_package_name' => 'custom-basic',
            'is_default' => true,
        ]);

        $this->putJson("/api/v1/admin/products/{$productId}/pricing", [
            'pricing' => [
                [
                    'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
                    'currency' => 'usd',
                    'price' => 10.00,
                    'setup_fee' => 2.50,
                    'is_enabled' => true,
                ],
            ],
        ])->assertOk();

        $orderResponse = $this->postJson('/api/v1/admin/orders/place', [
            'client_id' => $client->id,
            'currency' => 'USD',
            'items' => [
                [
                    'product_id' => $productId,
                    'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
                    'domain' => 'customer.example.test',
                    'quantity' => 1,
                ],
            ],
        ]);

        $orderResponse->assertCreated()
            ->assertJsonPath('data.status', Order::STATUS_PENDING)
            ->assertJsonPath('data.items.0.domain', 'customer.example.test');

        $orderId = $orderResponse->json('data.id');
        $orderItemId = $orderResponse->json('data.items.0.id');

        $invoice = Invoice::query()
            ->where('tenant_id', $tenant->id)
            ->where('order_id', $orderId)
            ->firstOrFail();

        $this->assertSame(Invoice::STATUS_UNPAID, $invoice->status);
        $this->assertSame(1250, $invoice->total_minor);

        $this->postJson("/api/v1/admin/invoices/{$invoice->id}/payments", [
            'type' => 'payment',
            'status' => 'completed',
            'payment_method' => 'offline',
            'amount_minor' => $invoice->total_minor,
            'currency' => 'USD',
            'reference' => 'manual-automation-001',
        ])->assertCreated()
            ->assertJsonPath('data.status', 'completed');

        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
            'status' => Invoice::STATUS_PAID,
            'amount_paid_minor' => 1250,
            'balance_due_minor' => 0,
        ]);

        $this->assertDatabaseHas('services', [
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'product_id' => $productId,
            'server_id' => $serverId,
            'order_id' => $orderId,
            'order_item_id' => $orderItemId,
            'domain' => 'customer.example.test',
            'status' => Service::STATUS_PENDING,
            'provisioning_state' => Service::PROVISIONING_IDLE,
        ]);

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'status' => Order::STATUS_COMPLETED,
        ]);
    }
}
