<?php

namespace Tests\Feature\Security;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Permission;
use App\Models\Product;
use App\Models\ProductPricing;
use App\Models\Role;
use App\Models\Server;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MassAssignmentProtectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_server_model_discards_sensitive_mass_assignment_fields(): void
    {
        $server = new Server();
        $server->fill([
            'tenant_id' => 'tenant-123',
            'name' => 'Primary Node',
            'hostname' => 'node-1.example.test',
            'panel_type' => Server::PANEL_CPANEL,
            'api_endpoint' => 'https://node-1.example.test:2087',
            'api_token' => 'secret-token',
            'credentials' => ['api_token' => 'secret-token'],
            'current_accounts' => 42,
            'last_tested_at' => now(),
        ]);

        $this->assertNull($server->tenant_id);
        $this->assertSame('Primary Node', $server->name);
        $this->assertSame('node-1.example.test', $server->hostname);
        $this->assertSame(Server::PANEL_CPANEL, $server->panel_type);
        $this->assertSame('https://node-1.example.test:2087', $server->api_endpoint);
        $this->assertNull($server->getRawOriginal('api_token'));
        $this->assertSame([], $server->credentials);
        $this->assertSame(0, $server->current_accounts);
        $this->assertNull($server->last_tested_at);
    }

    public function test_service_model_discards_tenant_owner_and_service_controlled_fields(): void
    {
        $service = new Service();
        $service->fill([
            'tenant_id' => 'tenant-123',
            'client_id' => 'client-123',
            'product_id' => 'product-123',
            'user_id' => 'user-123',
            'billing_cycle' => 'monthly',
            'domain' => 'customer.example.test',
            'status' => Service::STATUS_ACTIVE,
            'provisioning_state' => Service::PROVISIONING_SYNCED,
            'external_reference' => 'cpanel-user',
            'activated_at' => now(),
            'notes' => 'Provision me.',
        ]);

        $this->assertNull($service->tenant_id);
        $this->assertSame('client-123', $service->client_id);
        $this->assertSame('product-123', $service->product_id);
        $this->assertNull($service->user_id);
        $this->assertSame('monthly', $service->billing_cycle);
        $this->assertSame('customer.example.test', $service->domain);
        $this->assertNull($service->status);
        $this->assertNull($service->provisioning_state);
        $this->assertNull($service->external_reference);
        $this->assertNull($service->activated_at);
        $this->assertSame('Provision me.', $service->notes);
    }

    public function test_invoice_model_discards_tenant_id_on_fill(): void
    {
        $invoice = new Invoice();
        $invoice->fill([
            'tenant_id' => 'tenant-123',
            'client_id' => 'client-123',
            'reference_number' => 'INV-100',
            'status' => Invoice::STATUS_UNPAID,
            'currency' => 'USD',
            'subtotal_minor' => 1000,
            'total_minor' => 1000,
        ]);

        $this->assertNull($invoice->tenant_id);
        $this->assertSame('client-123', $invoice->client_id);
        $this->assertSame('INV-100', $invoice->reference_number);
        $this->assertSame(1000, $invoice->subtotal_minor);
        $this->assertSame(1000, $invoice->total_minor);
    }

    public function test_client_model_discards_tenant_id_on_fill(): void
    {
        $client = new Client();
        $client->fill([
            'tenant_id' => 'tenant-123',
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Example Corp',
            'email' => 'billing@example.test',
            'status' => Client::STATUS_ACTIVE,
        ]);

        $this->assertNull($client->tenant_id);
        $this->assertSame(Client::TYPE_COMPANY, $client->client_type);
        $this->assertSame('Example Corp', $client->company_name);
        $this->assertSame('billing@example.test', $client->email);
        $this->assertSame(Client::STATUS_ACTIVE, $client->status);
    }

    public function test_permission_and_tenant_user_models_discard_scoped_identity_fields(): void
    {
        $permission = new Permission();
        $permission->fill([
            'tenant_id' => 'tenant-123',
            'name' => 'clients.view',
            'guard_name' => 'web',
        ]);

        $tenantUser = new TenantUser();
        $tenantUser->fill([
            'tenant_id' => 'tenant-123',
            'user_id' => 'user-123',
            'role_id' => 99,
            'is_primary' => true,
        ]);

        $this->assertNull($permission->tenant_id);
        $this->assertSame('clients.view', $permission->name);
        $this->assertNull($tenantUser->tenant_id);
        $this->assertNull($tenantUser->user_id);
        $this->assertNull($tenantUser->role_id);
        $this->assertTrue($tenantUser->is_primary);
    }

    public function test_service_create_request_ignores_service_controlled_fields(): void
    {
        [$tenant, $user] = $this->actingTenantAdmin();

        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Acme Hosting',
            'email' => 'client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $product = Product::query()->create([
            'tenant_id' => $tenant->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Managed Hosting',
            'slug' => 'managed-hosting',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_PUBLIC,
            'display_order' => 0,
            'is_featured' => false,
        ]);

        $response = $this->postJson('/api/v1/admin/services', [
            'client_id' => $client->id,
            'product_id' => $product->id,
            'user_id' => $user->id,
            'billing_cycle' => 'monthly',
            'service_type' => 'hosting',
            'status' => Service::STATUS_ACTIVE,
            'provisioning_state' => Service::PROVISIONING_SYNCED,
            'external_reference' => 'malicious-ref',
            'activated_at' => now()->toIso8601String(),
            'domain' => 'customer.example.test',
        ]);

        $serviceId = $response->json('data.id');

        $response
            ->assertCreated()
            ->assertJsonPath('data.status', Service::STATUS_PENDING)
            ->assertJsonPath('data.provisioning_state', Service::PROVISIONING_IDLE);

        $this->assertDatabaseHas('services', [
            'id' => $serviceId,
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => Service::STATUS_PENDING,
            'provisioning_state' => Service::PROVISIONING_IDLE,
            'external_reference' => null,
        ]);
    }

    public function test_server_create_request_ignores_system_controlled_fields(): void
    {
        [, $user] = $this->actingTenantAdmin();

        $response = $this->postJson('/api/v1/admin/servers', [
            'name' => 'Primary Node',
            'hostname' => 'node-1.example.test',
            'panel_type' => Server::PANEL_CPANEL,
            'api_endpoint' => 'https://node-1.example.test:2087',
            'api_port' => 2087,
            'status' => Server::STATUS_ACTIVE,
            'verify_ssl' => true,
            'max_accounts' => 250,
            'current_accounts' => 87,
            'last_tested_at' => now()->subDay()->toIso8601String(),
            'username' => 'root',
            'credentials' => [
                'api_token' => 'placeholder-token',
            ],
        ]);

        $serverId = $response->json('data.id');

        $response->assertCreated();

        $this->assertDatabaseHas('servers', [
            'id' => $serverId,
            'tenant_id' => $user->tenant_id,
            'account_count' => 0,
        ]);

        $this->assertNull(Server::query()->findOrFail($serverId)->last_tested_at);
    }

    public function test_client_create_ignores_crafted_tenant_id(): void
    {
        [$tenant] = $this->actingTenantAdmin();
        $foreignTenant = $this->createTenant('foreign-client-tenant');

        $response = $this->postJson('/api/v1/admin/clients', [
            'tenant_id' => $foreignTenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Crafted Tenant Client',
            'email' => 'crafted-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $clientId = $response->json('data.id');

        $response
            ->assertCreated()
            ->assertJsonPath('data.tenant_id', $tenant->id);

        $this->assertDatabaseHas('clients', [
            'id' => $clientId,
            'tenant_id' => $tenant->id,
        ]);
    }

    public function test_order_create_ignores_crafted_tenant_id(): void
    {
        [$tenant] = $this->actingTenantAdmin();
        $foreignTenant = $this->createTenant('foreign-order-tenant');

        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Order Client',
            'email' => 'order-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $product = Product::query()->create([
            'tenant_id' => $tenant->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Order Product',
            'slug' => 'order-product',
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
            'price' => '5.00',
            'setup_fee' => '0.00',
            'is_enabled' => true,
        ]);

        $response = $this->postJson('/api/v1/admin/orders', [
            'tenant_id' => $foreignTenant->id,
            'client_id' => $client->id,
            'currency' => 'USD',
            'items' => [
                [
                    'product_id' => $product->id,
                    'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
                    'quantity' => 1,
                    'configurable_options' => [],
                ],
            ],
        ]);

        $orderId = $response->json('data.id');

        $response
            ->assertCreated()
            ->assertJsonPath('data.tenant_id', $tenant->id);

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'tenant_id' => $tenant->id,
        ]);
    }

    public function test_invoice_create_ignores_crafted_tenant_id(): void
    {
        [$tenant] = $this->actingTenantAdmin();
        $foreignTenant = $this->createTenant('foreign-invoice-tenant');

        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Invoice Client',
            'email' => 'invoice-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $response = $this->postJson('/api/v1/admin/invoices', [
            'tenant_id' => $foreignTenant->id,
            'client_id' => $client->id,
            'issue_date' => '2026-03-08',
            'due_date' => '2026-03-15',
            'items' => [
                [
                    'item_type' => 'service',
                    'description' => 'Manual invoice line',
                    'quantity' => 1,
                    'unit_price_minor' => 1000,
                ],
            ],
        ]);

        $invoiceId = $response->json('data.id');

        $response
            ->assertCreated()
            ->assertJsonPath('data.tenant_id', $tenant->id);

        $this->assertDatabaseHas('invoices', [
            'id' => $invoiceId,
            'tenant_id' => $tenant->id,
        ]);
    }

    private function actingTenantAdmin(): array
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = $this->createTenant('security-tenant');

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'security-admin@example.test',
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

        Sanctum::actingAs($user);

        return [$tenant, $user];
    }

    private function createTenant(string $slug): Tenant
    {
        return Tenant::query()->create([
            'name' => str($slug)->replace('-', ' ')->title()->toString(),
            'slug' => $slug,
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);
    }
}
