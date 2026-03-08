<?php

namespace Tests\Feature\Orders;

use App\Models\Client;
use App\Models\ConfigurableOption;
use App\Models\ConfigurableOptionChoice;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductPricing;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderManagementApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_can_review_create_and_place_orders(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Orders Tenant',
            'slug' => 'orders-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'orders-admin@example.test',
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

        $client = Client::query()->create([
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
            'name' => 'Starter Hosting',
            'slug' => 'starter-hosting',
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
            'price' => '5.99',
            'setup_fee' => '1.00',
            'is_enabled' => true,
        ]);

        $option = ConfigurableOption::query()->create([
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
            'configurable_option_id' => $option->id,
            'label' => '10 GB',
            'value' => '10gb',
            'is_default' => true,
            'display_order' => 0,
        ]);

        Sanctum::actingAs($user);

        $payload = [
            'client_id' => $client->id,
            'currency' => 'USD',
            'discount_type' => Order::DISCOUNT_FIXED,
            'discount_value' => 100,
            'tax_rate_bps' => 1500,
            'notes' => 'Initial order.',
            'items' => [
                [
                    'product_id' => $product->id,
                    'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
                    'quantity' => 2,
                    'configurable_options' => [
                        [
                            'configurable_option_id' => $option->id,
                            'selected_value' => '10gb',
                        ],
                    ],
                ],
            ],
        ];

        $this->postJson('/api/v1/admin/orders/review', $payload)
            ->assertOk()
            ->assertJsonPath('data.subtotal_minor', 1398)
            ->assertJsonPath('data.discount_amount_minor', 100)
            ->assertJsonPath('data.tax_amount_minor', 194)
            ->assertJsonPath('data.total_minor', 1492)
            ->assertJsonPath('data.items.0.product_name', 'Starter Hosting');

        $orderResponse = $this->postJson('/api/v1/admin/orders', $payload);
        $orderId = $orderResponse->json('data.id');

        $orderResponse
            ->assertCreated()
            ->assertJsonPath('data.status', Order::STATUS_DRAFT)
            ->assertJsonPath('data.total_minor', 1492)
            ->assertJsonPath('data.items.0.configurable_options.0.selected_value', '10gb');

        $this->postJson("/api/v1/admin/orders/{$orderId}/place")
            ->assertOk()
            ->assertJsonPath('data.status', Order::STATUS_PENDING);

        $this->putJson("/api/v1/admin/orders/{$orderId}", array_merge($payload, [
            'status' => Order::STATUS_ACCEPTED,
        ]))
            ->assertOk()
            ->assertJsonPath('data.status', Order::STATUS_ACCEPTED);

        $this->getJson('/api/v1/admin/orders')
            ->assertOk()
            ->assertJsonPath('data.0.id', $orderId);

        $this->getJson("/api/v1/admin/orders/{$orderId}")
            ->assertOk()
            ->assertJsonPath('data.client.id', $client->id)
            ->assertJsonPath('data.items.0.product_id', $product->id);
    }
}
