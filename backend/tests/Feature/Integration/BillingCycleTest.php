<?php

namespace Tests\Feature\Integration;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\ProductPricing;
use App\Models\Service;
use App\Models\Subscription;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

class BillingCycleTest extends IntegrationTestCase
{
    public function test_subscription_renewal_invoice_payment_and_follow_up_recurring_invoice_flow(): void
    {
        $tenant = $this->createTenant('integration-billing-cycle');
        $tenantAdmin = $this->createTenantAdmin($tenant, 'integration-billing-admin@example.test');

        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Billing Cycle Client',
            'email' => 'billing-cycle-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $product = Product::query()->create([
            'tenant_id' => $tenant->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Recurring Hosting Plan',
            'slug' => 'recurring-hosting-plan',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_PUBLIC,
            'display_order' => 0,
            'is_featured' => false,
        ]);

        $service = Service::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'product_id' => $product->id,
            'user_id' => $tenantAdmin->id,
            'reference_number' => 'SVC-BILLING-CYCLE-001',
            'service_type' => Service::TYPE_HOSTING,
            'status' => Service::STATUS_ACTIVE,
            'provisioning_state' => Service::PROVISIONING_SYNCED,
            'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
            'domain' => 'billing-cycle.example.test',
            'username' => 'billingcycle',
        ]);

        $initialNextBillingDate = Carbon::now()->addMonthNoOverflow()->startOfDay();

        $subscription = Subscription::query()->create([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'service_id' => $service->id,
            'product_id' => $product->id,
            'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
            'price' => 1999,
            'currency' => 'USD',
            'status' => 'active',
            'next_billing_date' => $initialNextBillingDate->toDateString(),
            'last_billed_at' => null,
            'grace_period_days' => 3,
            'auto_renew' => true,
        ]);

        Sanctum::actingAs($tenantAdmin);

        $renewalInvoiceResponse = $this->postJson('/api/v1/admin/invoices', [
            'client_id' => $client->id,
            'currency' => 'USD',
            'issue_date' => Carbon::now()->toDateString(),
            'due_date' => Carbon::now()->addDays(5)->toDateString(),
            'recurring_cycle' => ProductPricing::CYCLE_MONTHLY,
            'next_invoice_date' => $initialNextBillingDate->toDateString(),
            'items' => [
                [
                    'item_type' => 'manual',
                    'description' => 'Monthly renewal for recurring hosting plan',
                    'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
                    'quantity' => 1,
                    'unit_price_minor' => 1999,
                    'discount_amount_minor' => 0,
                    'tax_amount_minor' => 0,
                    'metadata' => [
                        'subscription_id' => $subscription->id,
                        'service_id' => $service->id,
                    ],
                ],
            ],
        ]);

        $invoiceId = $renewalInvoiceResponse->json('data.id');
        $invoiceTotalMinor = (int) $renewalInvoiceResponse->json('data.total_minor');

        $renewalInvoiceResponse
            ->assertCreated()
            ->assertJsonPath('data.recurring_cycle', ProductPricing::CYCLE_MONTHLY)
            ->assertJsonPath('data.next_invoice_date', $initialNextBillingDate->toDateString());

        $this->postJson("/api/v1/admin/invoices/{$invoiceId}/payments", [
            'payment_method' => 'manual',
            'amount_minor' => $invoiceTotalMinor,
            'reference' => 'BILL-CYCLE-PAY-001',
        ])->assertCreated()
            ->assertJsonPath('data.amount_minor', $invoiceTotalMinor);

        $this->getJson("/api/v1/admin/invoices/{$invoiceId}")
            ->assertOk()
            ->assertJsonPath('data.status', Invoice::STATUS_PAID)
            ->assertJsonPath('data.balance_due_minor', 0);

        $nextBillingDate = $initialNextBillingDate->copy()->addMonthNoOverflow()->toDateString();

        $followUpRenewalInvoiceResponse = $this->postJson('/api/v1/admin/invoices', [
            'client_id' => $client->id,
            'currency' => 'USD',
            'issue_date' => Carbon::now()->toDateString(),
            'due_date' => Carbon::now()->addDays(5)->toDateString(),
            'recurring_cycle' => ProductPricing::CYCLE_MONTHLY,
            'next_invoice_date' => $nextBillingDate,
            'items' => [
                [
                    'item_type' => 'manual',
                    'description' => 'Monthly renewal follow-up for recurring hosting plan',
                    'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
                    'quantity' => 1,
                    'unit_price_minor' => 1999,
                    'discount_amount_minor' => 0,
                    'tax_amount_minor' => 0,
                    'metadata' => [
                        'subscription_id' => $subscription->id,
                        'service_id' => $service->id,
                    ],
                ],
            ],
        ]);

        $followUpRenewalInvoiceResponse
            ->assertCreated()
            ->assertJsonPath('data.recurring_cycle', ProductPricing::CYCLE_MONTHLY)
            ->assertJsonPath('data.next_invoice_date', $nextBillingDate);

        $subscription->refresh();

        $this->assertSame($initialNextBillingDate->toDateString(), $subscription->next_billing_date?->toDateString());
        $this->assertNull($subscription->last_billed_at);
    }
}
