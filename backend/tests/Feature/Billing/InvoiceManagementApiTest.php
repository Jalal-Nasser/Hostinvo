<?php

namespace Tests\Feature\Billing;

use App\Models\Client;
use App\Models\Invoice;
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

class InvoiceManagementApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_can_create_manage_and_pay_invoices(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Billing Tenant',
            'slug' => 'billing-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'billing-admin@example.test',
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
            'company_name' => 'Billing Client',
            'email' => 'billing-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $order = Order::query()->create([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'user_id' => $user->id,
            'reference_number' => 'ORD-BILLING-001',
            'status' => Order::STATUS_ACCEPTED,
            'currency' => 'USD',
            'discount_value' => 0,
            'discount_amount_minor' => 0,
            'tax_rate_bps' => 0,
            'tax_amount_minor' => 0,
            'subtotal_minor' => 1000,
            'total_minor' => 1000,
            'accepted_at' => now(),
        ]);

        $product = Product::query()->create([
            'tenant_id' => $tenant->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Billing Product',
            'slug' => 'billing-product',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_PUBLIC,
            'display_order' => 0,
            'is_featured' => false,
        ]);

        $orderItem = $order->items()->create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_type' => $product->type,
            'billing_cycle' => 'monthly',
            'quantity' => 1,
            'unit_price_minor' => 1000,
            'setup_fee_minor' => 0,
            'subtotal_minor' => 1000,
            'total_minor' => 1000,
            'product_snapshot' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'sku' => null,
                'type' => $product->type,
            ],
            'configurable_options' => [],
        ]);

        Sanctum::actingAs($user);

        $payload = [
            'client_id' => $client->id,
            'order_id' => $order->id,
            'issue_date' => '2026-03-08',
            'due_date' => '2026-03-15',
            'recurring_cycle' => 'monthly',
            'next_invoice_date' => '2026-04-15',
            'discount_type' => Invoice::DISCOUNT_FIXED,
            'discount_value' => 100,
            'credit_applied_minor' => 50,
            'tax_rate_bps' => 1000,
            'notes' => 'Initial billing invoice.',
        ];

        $invoiceResponse = $this->postJson('/api/v1/admin/invoices', $payload);
        $invoiceId = $invoiceResponse->json('data.id');

        $invoiceResponse
            ->assertCreated()
            ->assertJsonPath('data.status', Invoice::STATUS_UNPAID)
            ->assertJsonPath('data.subtotal_minor', 1000)
            ->assertJsonPath('data.discount_amount_minor', 100)
            ->assertJsonPath('data.credit_applied_minor', 50)
            ->assertJsonPath('data.tax_amount_minor', 85)
            ->assertJsonPath('data.total_minor', 935)
            ->assertJsonPath('data.balance_due_minor', 935)
            ->assertJsonPath('data.order.id', $order->id)
            ->assertJsonPath('data.items.0.order_item_id', $orderItem->id);

        $this->putJson("/api/v1/admin/invoices/{$invoiceId}", array_merge($payload, [
            'status' => Invoice::STATUS_OVERDUE,
        ]))
            ->assertOk()
            ->assertJsonPath('data.status', Invoice::STATUS_OVERDUE);

        $this->postJson("/api/v1/admin/invoices/{$invoiceId}/payments", [
            'payment_method' => 'manual',
            'amount_minor' => 935,
            'reference' => 'PAY-INV-001',
        ])
            ->assertCreated()
            ->assertJsonPath('data.type', 'payment')
            ->assertJsonPath('data.amount_minor', 935)
            ->assertJsonPath('data.invoice.reference_number', $invoiceResponse->json('data.reference_number'));

        $this->getJson("/api/v1/admin/invoices/{$invoiceId}")
            ->assertOk()
            ->assertJsonPath('data.status', Invoice::STATUS_PAID)
            ->assertJsonPath('data.amount_paid_minor', 935)
            ->assertJsonPath('data.balance_due_minor', 0)
            ->assertJsonPath('data.payments.0.reference', 'PAY-INV-001');

        $this->postJson("/api/v1/admin/invoices/{$invoiceId}/payments", [
            'type' => 'refund',
            'payment_method' => 'manual',
            'amount_minor' => 935,
            'reference' => 'REF-INV-001',
        ])
            ->assertCreated()
            ->assertJsonPath('data.type', 'refund');

        $this->getJson("/api/v1/admin/invoices/{$invoiceId}")
            ->assertOk()
            ->assertJsonPath('data.status', Invoice::STATUS_REFUNDED)
            ->assertJsonPath('data.refunded_amount_minor', 935);

        $this->getJson('/api/v1/admin/invoices')
            ->assertOk()
            ->assertJsonPath('data.0.id', $invoiceId);

        $this->getJson('/api/v1/admin/payments')
            ->assertOk()
            ->assertJsonPath('data.0.invoice_id', $invoiceId);
    }
}
