<?php

namespace Tests\Feature\Integration;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\ProductPricing;
use App\Models\Tenant;
use App\Services\Tenancy\TenantSettingService;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

class WebhookProcessingTest extends IntegrationTestCase
{
    public function test_stripe_webhook_processes_payment_and_transaction_to_completion(): void
    {
        [$tenant, $tenantAdmin, $invoice] = $this->createBillingContext(
            'integration-webhook-stripe',
            'integration-webhook-stripe-admin@example.test',
            'integration-webhook-stripe-client@example.test',
            'INV-INTEGRATION-STRIPE-001',
            2500
        );
        $this->configureStripe($tenant);

        Http::fake([
            'https://api.stripe.com/v1/checkout/sessions' => Http::response([
                'id' => 'cs_integration_stripe_123',
                'url' => 'https://checkout.stripe.test/pay/cs_integration_stripe_123',
            ], 200),
        ]);

        Sanctum::actingAs($tenantAdmin);

        $checkoutResponse = $this->postJson("/api/v1/admin/invoices/{$invoice->id}/gateway-checkouts", [
            'gateway' => 'stripe',
            'success_url' => 'http://localhost:3000/en/dashboard/invoices/'.$invoice->id.'/pay?gateway=stripe&status=success',
            'cancel_url' => 'http://localhost:3000/en/dashboard/invoices/'.$invoice->id.'/pay?gateway=stripe&status=cancelled',
        ])->assertCreated();

        $paymentId = $checkoutResponse->json('data.payment.id');

        $event = [
            'type' => 'checkout.session.completed',
            'created' => now()->timestamp,
            'data' => [
                'object' => [
                    'id' => 'cs_integration_stripe_123',
                    'payment_status' => 'paid',
                    'payment_intent' => 'pi_integration_stripe_123',
                    'amount_total' => 2500,
                    'currency' => 'usd',
                    'metadata' => [
                        'payment_id' => $paymentId,
                        'invoice_id' => $invoice->id,
                        'tenant_id' => $tenant->id,
                    ],
                ],
            ],
        ];

        $payload = json_encode($event, JSON_THROW_ON_ERROR);
        $timestamp = now()->timestamp;
        $signature = hash_hmac('sha256', "{$timestamp}.{$payload}", 'whsec_hostinvo_test');

        $this->postJson('/api/v1/webhooks/stripe', json_decode($payload, true, 512, JSON_THROW_ON_ERROR), [
            'Stripe-Signature' => "t={$timestamp},v1={$signature}",
        ])->assertOk();

        $this->assertDatabaseHas('payments', [
            'id' => $paymentId,
            'status' => Payment::STATUS_COMPLETED,
            'reference' => 'pi_integration_stripe_123',
        ]);

        $this->assertDatabaseHas('transactions', [
            'payment_id' => $paymentId,
            'gateway' => 'stripe',
            'status' => Payment::STATUS_COMPLETED,
            'external_reference' => 'cs_integration_stripe_123',
        ]);

        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
            'status' => Invoice::STATUS_PAID,
            'balance_due_minor' => 0,
        ]);
    }

    public function test_paypal_webhook_processes_payment_and_transaction_to_completion(): void
    {
        [$tenant, $tenantAdmin, $invoice] = $this->createBillingContext(
            'integration-webhook-paypal',
            'integration-webhook-paypal-admin@example.test',
            'integration-webhook-paypal-client@example.test',
            'INV-INTEGRATION-PAYPAL-001',
            3100
        );
        $this->configurePayPal($tenant);

        Http::fake([
            'https://api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response([
                'access_token' => 'paypal-access-token',
            ], 200),
            'https://api-m.sandbox.paypal.com/v2/checkout/orders' => Http::response([
                'id' => 'PAYPAL-INTEGRATION-ORDER-123',
                'links' => [
                    ['rel' => 'approve', 'href' => 'https://paypal.test/checkout/PAYPAL-INTEGRATION-ORDER-123'],
                ],
            ], 201),
            'https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature' => Http::response([
                'verification_status' => 'SUCCESS',
            ], 200),
        ]);

        Sanctum::actingAs($tenantAdmin);

        $checkoutResponse = $this->postJson("/api/v1/admin/invoices/{$invoice->id}/gateway-checkouts", [
            'gateway' => 'paypal',
            'success_url' => 'http://localhost:3000/en/dashboard/invoices/'.$invoice->id.'/pay?gateway=paypal&status=approved',
            'cancel_url' => 'http://localhost:3000/en/dashboard/invoices/'.$invoice->id.'/pay?gateway=paypal&status=cancelled',
        ])->assertCreated();

        $paymentId = $checkoutResponse->json('data.payment.id');

        $this->postJson('/api/v1/webhooks/paypal', [
            'id' => 'WH-INTEGRATION-PP-001',
            'event_type' => 'PAYMENT.CAPTURE.COMPLETED',
            'create_time' => now()->toIso8601String(),
            'resource' => [
                'id' => 'PAYPAL-CAPTURE-123',
                'amount' => [
                    'value' => '31.00',
                    'currency_code' => 'USD',
                ],
                'supplementary_data' => [
                    'related_ids' => [
                        'order_id' => 'PAYPAL-INTEGRATION-ORDER-123',
                    ],
                ],
            ],
        ], [
            'paypal-auth-algo' => 'SHA256withRSA',
            'paypal-cert-url' => 'https://api-m.sandbox.paypal.com/certs/test',
            'paypal-transmission-id' => 'transmission-id',
            'paypal-transmission-sig' => 'signature',
            'paypal-transmission-time' => now()->toIso8601String(),
        ])->assertOk();

        $this->assertDatabaseHas('payments', [
            'id' => $paymentId,
            'status' => Payment::STATUS_COMPLETED,
            'reference' => 'PAYPAL-CAPTURE-123',
        ]);

        $this->assertDatabaseHas('transactions', [
            'payment_id' => $paymentId,
            'gateway' => 'paypal',
            'status' => Payment::STATUS_COMPLETED,
            'external_reference' => 'PAYPAL-INTEGRATION-ORDER-123',
        ]);

        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
            'status' => Invoice::STATUS_PAID,
            'balance_due_minor' => 0,
        ]);
    }

    private function createBillingContext(
        string $slug,
        string $adminEmail,
        string $clientEmail,
        string $invoiceReference,
        int $amountMinor
    ): array {
        $tenant = $this->createTenant($slug);
        $tenantAdmin = $this->createTenantAdmin($tenant, $adminEmail);

        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Webhook Integration Client',
            'email' => $clientEmail,
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $invoice = Invoice::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'user_id' => $tenantAdmin->id,
            'reference_number' => $invoiceReference,
            'status' => Invoice::STATUS_UNPAID,
            'currency' => 'USD',
            'issue_date' => now()->startOfDay(),
            'due_date' => now()->addDays(5)->startOfDay(),
            'discount_value' => 0,
            'discount_amount_minor' => 0,
            'credit_applied_minor' => 0,
            'tax_rate_bps' => 0,
            'tax_amount_minor' => 0,
            'subtotal_minor' => $amountMinor,
            'total_minor' => $amountMinor,
            'amount_paid_minor' => 0,
            'refunded_amount_minor' => 0,
            'balance_due_minor' => $amountMinor,
        ]);

        $invoice->items()->create([
            'tenant_id' => $tenant->id,
            'item_type' => 'manual',
            'description' => 'Webhook integration invoice item',
            'related_type' => null,
            'related_id' => null,
            'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
            'billing_period_starts_at' => now()->startOfMonth(),
            'billing_period_ends_at' => now()->endOfMonth(),
            'quantity' => 1,
            'unit_price_minor' => $amountMinor,
            'subtotal_minor' => $amountMinor,
            'discount_amount_minor' => 0,
            'tax_amount_minor' => 0,
            'total_minor' => $amountMinor,
            'metadata' => null,
        ]);

        return [$tenant, $tenantAdmin, $invoice];
    }

    private function configureStripe(Tenant $tenant): void
    {
        $settings = app(TenantSettingService::class);

        $settings->put($tenant, 'payments.stripe.enabled', true);
        $settings->put($tenant, 'payments.stripe.publishable_key', 'pk_test_hostinvo_public', true);
        $settings->put($tenant, 'payments.stripe.secret_key', 'sk_test_hostinvo_secret', true);
        $settings->put($tenant, 'payments.stripe.webhook_secret', 'whsec_hostinvo_test', true);
    }

    private function configurePayPal(Tenant $tenant): void
    {
        $settings = app(TenantSettingService::class);

        $settings->put($tenant, 'payments.paypal.enabled', true);
        $settings->put($tenant, 'payments.paypal.client_id', 'paypal-client-id', true);
        $settings->put($tenant, 'payments.paypal.client_secret', 'paypal-client-secret', true);
        $settings->put($tenant, 'payments.paypal.webhook_id', 'paypal-webhook-id', true);
        $settings->put($tenant, 'payments.paypal.mode', 'sandbox');
    }
}
