<?php

namespace Tests\Feature\Orders;

use App\Models\Client;
use App\Models\Order;
use App\Models\Product;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_routes_do_not_allow_cross_tenant_access(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenantA = Tenant::query()->create([
            'name' => 'Tenant A',
            'slug' => 'tenant-a-orders',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $tenantB = Tenant::query()->create([
            'name' => 'Tenant B',
            'slug' => 'tenant-b-orders',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenantA->id,
            'email' => 'tenant-a-orders-admin@example.test',
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
            'company_name' => 'Foreign Client',
            'email' => 'foreign-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $product = Product::query()->create([
            'tenant_id' => $tenantB->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Foreign Product',
            'slug' => 'foreign-product-orders',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_PUBLIC,
            'display_order' => 0,
            'is_featured' => false,
        ]);

        $order = Order::query()->forceCreate([
            'tenant_id' => $tenantB->id,
            'client_id' => $client->id,
            'reference_number' => 'ORD-FOREIGN-001',
            'status' => Order::STATUS_DRAFT,
            'currency' => 'USD',
            'discount_value' => 0,
            'discount_amount_minor' => 0,
            'tax_rate_bps' => 0,
            'tax_amount_minor' => 0,
            'subtotal_minor' => 599,
            'total_minor' => 599,
        ]);

        $order->items()->create([
            'tenant_id' => $tenantB->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_type' => $product->type,
            'billing_cycle' => 'monthly',
            'quantity' => 1,
            'unit_price_minor' => 599,
            'setup_fee_minor' => 0,
            'subtotal_minor' => 599,
            'total_minor' => 599,
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/v1/admin/orders/{$order->id}")
            ->assertForbidden();
    }
}
