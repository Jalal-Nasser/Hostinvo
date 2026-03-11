<?php

namespace Tests\Feature\Integration;

use App\Models\Client;
use App\Models\ConfigurableOption;
use App\Models\ConfigurableOptionChoice;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductPricing;
use App\Models\ProvisioningJob;
use App\Models\ProvisioningLog;
use App\Models\Role;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderProvisioningTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_to_invoice_payment_to_service_provisioning_flow(): void
    {
        $this->seed(RolePermissionSeeder::class);

        Http::fake([
            '*' => Http::response([
                'metadata' => [
                    'result' => 1,
                    'reason' => 'OK',
                    'command' => 'createacct',
                ],
                'data' => [
                    'user' => 'ordercustomer',
                    'domain' => 'order-customer.example.test',
                    'ip' => '127.0.0.1',
                ],
            ], 200),
        ]);

        $tenant = $this->createTenant('integration-order-provisioning');
        $tenantAdmin = $this->createTenantAdmin($tenant, 'integration-order-admin@example.test');

        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Integration Order Client',
            'email' => 'integration-order-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $product = Product::query()->create([
            'tenant_id' => $tenant->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Integration Hosting Plan',
            'slug' => 'integration-hosting-plan',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_PUBLIC,
            'display_order' => 0,
            'is_featured' => false,
        ]);

        ProductPricing::query()->create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
            'currency' => 'USD',
            'price' => '9.99',
            'setup_fee' => '1.00',
            'is_enabled' => true,
        ]);

        $storageOption = ConfigurableOption::query()->create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'name' => 'Storage',
            'code' => 'storage',
            'option_type' => ConfigurableOption::TYPE_SELECT,
            'status' => ConfigurableOption::STATUS_ACTIVE,
            'is_required' => true,
            'display_order' => 0,
        ]);

        ConfigurableOptionChoice::query()->create([
            'tenant_id' => $tenant->id,
            'configurable_option_id' => $storageOption->id,
            'label' => '20 GB',
            'value' => '20gb',
            'is_default' => true,
            'display_order' => 0,
        ]);

        Sanctum::actingAs($tenantAdmin);

        $serverGroupResponse = $this->postJson('/api/v1/admin/server-groups', [
            'name' => 'Integration Group',
            'selection_strategy' => 'least_accounts',
            'status' => 'active',
            'notes' => 'Group used for order provisioning integration tests.',
        ])->assertCreated();

        $serverResponse = $this->postJson('/api/v1/admin/servers', [
            'server_group_id' => $serverGroupResponse->json('data.id'),
            'name' => 'Integration Node',
            'hostname' => 'integration-node.example.test',
            'panel_type' => 'cpanel',
            'api_endpoint' => 'https://integration-node.example.test:2087',
            'api_port' => 2087,
            'status' => 'active',
            'verify_ssl' => true,
            'max_accounts' => 100,
            'current_accounts' => 0,
            'username' => 'root',
            'credentials' => [
                'api_token' => 'integration-node-token',
            ],
            'packages' => [
                [
                    'product_id' => $product->id,
                    'panel_package_name' => 'integration_basic',
                    'display_name' => 'Integration Basic',
                    'is_default' => true,
                ],
            ],
        ])->assertCreated();

        $serverId = $serverResponse->json('data.id');

        $orderResponse = $this->postJson('/api/v1/admin/orders', [
            'client_id' => $client->id,
            'currency' => 'USD',
            'discount_type' => Order::DISCOUNT_FIXED,
            'discount_value' => 100,
            'tax_rate_bps' => 1000,
            'notes' => 'Integration order for provisioning flow.',
            'items' => [
                [
                    'product_id' => $product->id,
                    'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
                    'quantity' => 1,
                    'configurable_options' => [
                        [
                            'configurable_option_id' => $storageOption->id,
                            'selected_value' => '20gb',
                        ],
                    ],
                ],
            ],
        ]);

        $orderId = $orderResponse->json('data.id');

        $orderResponse
            ->assertCreated()
            ->assertJsonPath('data.id', $orderId)
            ->assertJsonPath('data.status', Order::STATUS_DRAFT);

        $this->postJson("/api/v1/admin/orders/{$orderId}/place")
            ->assertOk()
            ->assertJsonPath('data.status', Order::STATUS_PENDING);

        $this->putJson("/api/v1/admin/orders/{$orderId}", [
            'client_id' => $client->id,
            'currency' => 'USD',
            'discount_type' => Order::DISCOUNT_FIXED,
            'discount_value' => 100,
            'tax_rate_bps' => 1000,
            'notes' => 'Order accepted for billing.',
            'status' => Order::STATUS_ACCEPTED,
            'items' => [
                [
                    'id' => $orderResponse->json('data.items.0.id'),
                    'product_id' => $product->id,
                    'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
                    'quantity' => 1,
                    'configurable_options' => [
                        [
                            'configurable_option_id' => $storageOption->id,
                            'selected_value' => '20gb',
                        ],
                    ],
                ],
            ],
        ])->assertOk()
            ->assertJsonPath('data.status', Order::STATUS_ACCEPTED);

        $invoiceResponse = $this->postJson('/api/v1/admin/invoices', [
            'client_id' => $client->id,
            'order_id' => $orderId,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'recurring_cycle' => ProductPricing::CYCLE_MONTHLY,
            'next_invoice_date' => now()->addMonth()->toDateString(),
            'discount_type' => Invoice::DISCOUNT_FIXED,
            'discount_value' => 0,
            'credit_applied_minor' => 0,
            'tax_rate_bps' => 0,
        ]);

        $invoiceId = $invoiceResponse->json('data.id');
        $invoiceTotalMinor = (int) $invoiceResponse->json('data.total_minor');

        $invoiceResponse
            ->assertCreated()
            ->assertJsonPath('data.id', $invoiceId)
            ->assertJsonPath('data.order.id', $orderId)
            ->assertJsonPath('data.status', Invoice::STATUS_UNPAID);

        $this->postJson("/api/v1/admin/invoices/{$invoiceId}/payments", [
            'payment_method' => 'manual',
            'amount_minor' => $invoiceTotalMinor,
            'reference' => 'INT-ORDER-PAY-001',
        ])->assertCreated()
            ->assertJsonPath('data.type', 'payment')
            ->assertJsonPath('data.amount_minor', $invoiceTotalMinor);

        $this->getJson("/api/v1/admin/invoices/{$invoiceId}")
            ->assertOk()
            ->assertJsonPath('data.status', Invoice::STATUS_PAID)
            ->assertJsonPath('data.balance_due_minor', 0);

        $serviceResponse = $this->postJson('/api/v1/admin/services', [
            'client_id' => $client->id,
            'product_id' => $product->id,
            'order_id' => $orderId,
            'server_id' => $serverId,
            'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
            'service_type' => Service::TYPE_HOSTING,
            'status' => Service::STATUS_PENDING,
            'provisioning_state' => Service::PROVISIONING_IDLE,
            'domain' => 'order-customer.example.test',
            'username' => 'ordercustomer',
            'notes' => 'Integration service created from paid order.',
        ]);

        $serviceId = $serviceResponse->json('data.id');

        $serviceResponse
            ->assertCreated()
            ->assertJsonPath('data.id', $serviceId)
            ->assertJsonPath('data.order.id', $orderId);

        $dispatchResponse = $this->postJson("/api/v1/admin/services/{$serviceId}/operations/create_account", [
            'payload' => [],
        ]);

        $dispatchResponse
            ->assertAccepted()
            ->assertJsonPath('data.operation', ProvisioningJob::OPERATION_CREATE_ACCOUNT)
            ->assertJsonPath('data.status', ProvisioningJob::STATUS_COMPLETED);

        $this->assertDatabaseHas('provisioning_logs', [
            'service_id' => $serviceId,
            'operation' => ProvisioningJob::OPERATION_CREATE_ACCOUNT,
            'status' => ProvisioningLog::STATUS_COMPLETED,
        ]);

        $this->assertDatabaseHas('services', [
            'id' => $serviceId,
            'status' => Service::STATUS_ACTIVE,
            'provisioning_state' => Service::PROVISIONING_SYNCED,
        ]);
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
