<?php

namespace Tests\Feature\Billing;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\ProductPricing;
use App\Models\Service;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Billing\BillingAutomationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class BillingAutomationServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_generates_renewal_invoices_marks_overdue_and_suspends_services(): void
    {
        Mail::fake();

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

        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Automation Client',
            'email' => 'automation-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $product = Product::query()->create([
            'tenant_id' => $tenant->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Automation Hosting',
            'slug' => 'automation-hosting',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_PUBLIC,
            'display_order' => 0,
            'is_featured' => false,
        ]);

        $service = Service::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'product_id' => $product->id,
            'user_id' => $user->id,
            'reference_number' => 'SVC-AUTOMATION-001',
            'service_type' => Service::TYPE_HOSTING,
            'status' => Service::STATUS_ACTIVE,
            'provisioning_state' => Service::PROVISIONING_SYNCED,
            'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
            'price' => 2500,
            'currency' => 'USD',
            'domain' => 'automation.example.test',
            'next_due_date' => now()->subDays(5)->toDateString(),
        ]);

        $subscription = Subscription::query()->create([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'service_id' => $service->id,
            'product_id' => $product->id,
            'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
            'price' => 2500,
            'currency' => 'USD',
            'status' => 'active',
            'next_billing_date' => now()->subDays(5)->toDateString(),
            'last_billed_at' => null,
            'grace_period_days' => 3,
            'auto_renew' => true,
        ]);

        app(BillingAutomationService::class)->run();

        $invoice = Invoice::query()
            ->where('tenant_id', $tenant->id)
            ->where('client_id', $client->id)
            ->latest('created_at')
            ->first();

        $this->assertNotNull($invoice);
        $this->assertSame(Invoice::STATUS_OVERDUE, $invoice->status);
        $this->assertSame($subscription->id, $invoice->metadata['subscription_id'] ?? null);

        $service->refresh();
        $subscription->refresh();

        $this->assertSame(Service::STATUS_SUSPENDED, $service->status);
        $this->assertNotNull($service->suspended_at);
        $this->assertNotNull($subscription->last_billed_at);
        $this->assertTrue($subscription->next_billing_date->isFuture());
    }
}
