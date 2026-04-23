<?php

namespace Tests\Feature\Payments;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\License;
use App\Models\Payment;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantSetting;
use App\Models\TenantUser;
use App\Models\User;
use App\Models\WebhookLog;
use App\Services\Tenancy\TenantSettingService;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentGatewayApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_can_start_a_stripe_checkout_and_complete_payment_via_webhook(): void
    {
        $this->seed(RolePermissionSeeder::class);

        [$tenant, $user, $invoice] = $this->createBillingContext();
        $this->configureStripe($tenant);

        Http::fake([
            'https://api.stripe.com/v1/checkout/sessions' => Http::response([
                'id' => 'cs_test_hostinvo_123',
                'url' => 'https://checkout.stripe.test/pay/cs_test_hostinvo_123',
            ], 200),
        ]);

        Sanctum::actingAs($user);

        $checkoutResponse = $this->postJson("/api/v1/admin/invoices/{$invoice->id}/gateway-checkouts", [
            'gateway' => 'stripe',
            'success_url' => 'http://localhost:3000/en/dashboard/invoices/'.$invoice->id.'/pay?gateway=stripe&status=success',
            'cancel_url' => 'http://localhost:3000/en/dashboard/invoices/'.$invoice->id.'/pay?gateway=stripe&status=cancelled',
        ]);

        $paymentId = $checkoutResponse->json('data.payment.id');

        $checkoutResponse
            ->assertCreated()
            ->assertJsonPath('data.gateway', 'stripe')
            ->assertJsonPath('data.redirect_url', 'https://checkout.stripe.test/pay/cs_test_hostinvo_123')
            ->assertJsonPath('data.payment.status', Payment::STATUS_PENDING);

        $this->assertDatabaseHas('payments', [
            'id' => $paymentId,
            'tenant_id' => $tenant->id,
            'invoice_id' => $invoice->id,
            'payment_method' => 'stripe',
            'status' => Payment::STATUS_PENDING,
        ]);

        $this->assertDatabaseMissing('tenant_settings', [
            'tenant_id' => $tenant->id,
            'value' => 'sk_test_hostinvo_secret',
        ]);

        $event = [
            'type' => 'checkout.session.completed',
            'created' => now()->timestamp,
            'data' => [
                'object' => [
                    'id' => 'cs_test_hostinvo_123',
                    'payment_status' => 'paid',
                    'payment_intent' => 'pi_test_hostinvo_123',
                    'amount_total' => 1500,
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
        ])
            ->assertOk()
            ->assertJsonPath('data.status', WebhookLog::STATUS_PROCESSED);

        $this->getJson("/api/v1/admin/invoices/{$invoice->id}")
            ->assertOk()
            ->assertJsonPath('data.status', Invoice::STATUS_PAID)
            ->assertJsonPath('data.balance_due_minor', 0)
            ->assertJsonPath('data.amount_paid_minor', 1500);

        $this->assertDatabaseHas('payments', [
            'id' => $paymentId,
            'status' => Payment::STATUS_COMPLETED,
            'reference' => 'pi_test_hostinvo_123',
        ]);

        $this->assertDatabaseHas('webhook_logs', [
            'tenant_id' => $tenant->id,
            'gateway' => 'stripe',
            'status' => WebhookLog::STATUS_PROCESSED,
        ]);
    }

    public function test_stripe_failure_webhook_marks_pending_payment_failed_without_paying_invoice(): void
    {
        $this->seed(RolePermissionSeeder::class);

        [$tenant, $user, $invoice] = $this->createBillingContext();
        $this->configureStripe($tenant);

        Http::fake([
            'https://api.stripe.com/v1/checkout/sessions' => Http::response([
                'id' => 'cs_test_hostinvo_failed',
                'url' => 'https://checkout.stripe.test/pay/cs_test_hostinvo_failed',
            ], 200),
        ]);

        Sanctum::actingAs($user);

        $checkoutResponse = $this->postJson("/api/v1/admin/invoices/{$invoice->id}/gateway-checkouts", [
            'gateway' => 'stripe',
            'success_url' => 'http://localhost:3000/en/dashboard/invoices/'.$invoice->id.'/pay?gateway=stripe&status=success',
            'cancel_url' => 'http://localhost:3000/en/dashboard/invoices/'.$invoice->id.'/pay?gateway=stripe&status=cancelled',
        ]);

        $paymentId = $checkoutResponse->json('data.payment.id');
        $event = [
            'type' => 'checkout.session.expired',
            'created' => now()->timestamp,
            'data' => [
                'object' => [
                    'id' => 'cs_test_hostinvo_failed',
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
            'status' => Payment::STATUS_CANCELLED,
        ]);

        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
            'status' => Invoice::STATUS_UNPAID,
            'amount_paid_minor' => 0,
            'balance_due_minor' => 1500,
        ]);
    }

    public function test_tenant_admin_can_start_a_paypal_checkout_and_capture_the_returned_order(): void
    {
        $this->seed(RolePermissionSeeder::class);

        [$tenant, $user, $invoice] = $this->createBillingContext();
        $this->configurePayPal($tenant);

        Http::fake([
            'https://api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response([
                'access_token' => 'paypal-access-token',
            ], 200),
            'https://api-m.sandbox.paypal.com/v2/checkout/orders' => Http::response([
                'id' => 'PAYPAL-ORDER-123',
                'links' => [
                    ['rel' => 'approve', 'href' => 'https://paypal.test/checkout/PAYPAL-ORDER-123'],
                ],
            ], 201),
            'https://api-m.sandbox.paypal.com/v2/checkout/orders/PAYPAL-ORDER-123/capture' => Http::response([
                'status' => 'COMPLETED',
                'purchase_units' => [[
                    'payments' => [
                        'captures' => [[
                            'id' => 'PAYPAL-CAPTURE-123',
                            'amount' => [
                                'value' => '15.00',
                                'currency_code' => 'USD',
                            ],
                        ]],
                    ],
                ]],
            ], 201),
        ]);

        Sanctum::actingAs($user);

        $checkoutResponse = $this->postJson("/api/v1/admin/invoices/{$invoice->id}/gateway-checkouts", [
            'gateway' => 'paypal',
            'success_url' => 'http://localhost:3000/en/dashboard/invoices/'.$invoice->id.'/pay?gateway=paypal&status=approved',
            'cancel_url' => 'http://localhost:3000/en/dashboard/invoices/'.$invoice->id.'/pay?gateway=paypal&status=cancelled',
        ]);

        $checkoutResponse
            ->assertCreated()
            ->assertJsonPath('data.gateway', 'paypal')
            ->assertJsonPath('data.redirect_url', 'https://paypal.test/checkout/PAYPAL-ORDER-123')
            ->assertJsonPath('data.payment.status', Payment::STATUS_PENDING);

        $this->postJson("/api/v1/admin/invoices/{$invoice->id}/gateway-checkouts/paypal/capture", [
            'order_id' => 'PAYPAL-ORDER-123',
            'payer_id' => 'PAYER-123',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', Payment::STATUS_COMPLETED)
            ->assertJsonPath('data.reference', 'PAYPAL-CAPTURE-123');

        $this->getJson("/api/v1/admin/invoices/{$invoice->id}")
            ->assertOk()
            ->assertJsonPath('data.status', Invoice::STATUS_PAID)
            ->assertJsonPath('data.balance_due_minor', 0);
    }

    public function test_portal_user_can_load_paypal_gateway_options_and_complete_checkout(): void
    {
        $this->seed(RolePermissionSeeder::class);

        [$tenant, $user, $invoice, $client] = $this->createBillingContext();
        $this->configurePayPal($tenant);
        $portalUser = $this->createPortalUser($tenant, $client);

        Http::fake([
            'https://api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response([
                'access_token' => 'paypal-access-token',
            ], 200),
            'https://api-m.sandbox.paypal.com/v2/checkout/orders' => Http::response([
                'id' => 'PAYPAL-ORDER-CLIENT-123',
                'links' => [
                    ['rel' => 'approve', 'href' => 'https://paypal.test/checkout/PAYPAL-ORDER-CLIENT-123'],
                ],
            ], 201),
            'https://api-m.sandbox.paypal.com/v2/checkout/orders/PAYPAL-ORDER-CLIENT-123/capture' => Http::response([
                'status' => 'COMPLETED',
                'purchase_units' => [[
                    'payments' => [
                        'captures' => [[
                            'id' => 'PAYPAL-CAPTURE-CLIENT-123',
                            'amount' => [
                                'value' => '15.00',
                                'currency_code' => 'USD',
                            ],
                        ]],
                    ],
                ]],
            ], 201),
        ]);

        Sanctum::actingAs($portalUser);

        $this->getJson("/api/v1/client/invoices/{$invoice->id}/gateway-options")
            ->assertOk()
            ->assertJsonPath('data.0.code', 'paypal')
            ->assertJsonPath('data.0.checkout.kind', 'paypal_js_sdk')
            ->assertJsonPath('data.0.checkout.client_id', 'paypal-client-id');

        $this->postJson("/api/v1/client/invoices/{$invoice->id}/gateway-checkouts", [
            'gateway' => 'paypal',
            'success_url' => 'http://localhost:3000/en/portal/invoices/'.$invoice->id.'/pay?gateway=paypal&status=approved',
            'cancel_url' => 'http://localhost:3000/en/portal/invoices/'.$invoice->id.'/pay?gateway=paypal&status=cancelled',
        ])->assertCreated()
            ->assertJsonPath('data.gateway', 'paypal')
            ->assertJsonPath('data.external_reference', 'PAYPAL-ORDER-CLIENT-123');

        $this->postJson("/api/v1/client/invoices/{$invoice->id}/gateway-checkouts/paypal/capture", [
            'order_id' => 'PAYPAL-ORDER-CLIENT-123',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', Payment::STATUS_COMPLETED)
            ->assertJsonPath('data.payment_method', 'paypal');

        $this->getJson("/api/v1/client/invoices/{$invoice->id}")
            ->assertOk()
            ->assertJsonPath('data.status', Invoice::STATUS_PAID)
            ->assertJsonPath('data.balance_due_minor', 0);
    }

    private function createBillingContext(): array
    {
        $tenant = Tenant::query()->create([
            'name' => 'Gateway Tenant',
            'slug' => 'gateway-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'gateway-admin@example.test',
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
            'license_key' => 'HOST-GATEWAY-PAYMENTS-001',
            'owner_email' => 'owner@gateway-tenant.test',
            'type' => License::PLAN_PROFESSIONAL,
            'plan' => License::PLAN_PROFESSIONAL,
            'license_type' => License::PLAN_PROFESSIONAL,
            'status' => License::STATUS_ACTIVE,
            'max_clients' => 100,
            'max_services' => 100,
            'activation_limit' => 1,
            'issued_at' => now(),
            'expires_at' => now()->addMonth(),
        ]);

        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Gateway Client',
            'email' => 'gateway-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $invoice = Invoice::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'user_id' => $user->id,
            'reference_number' => 'INV-GATEWAY-001',
            'status' => Invoice::STATUS_UNPAID,
            'currency' => 'USD',
            'issue_date' => now()->startOfDay(),
            'due_date' => now()->addDays(7)->startOfDay(),
            'discount_value' => 0,
            'discount_amount_minor' => 0,
            'credit_applied_minor' => 0,
            'tax_rate_bps' => 0,
            'tax_amount_minor' => 0,
            'subtotal_minor' => 1500,
            'total_minor' => 1500,
            'amount_paid_minor' => 0,
            'refunded_amount_minor' => 0,
            'balance_due_minor' => 1500,
        ]);

        $invoice->items()->create([
            'tenant_id' => $tenant->id,
            'item_type' => 'manual',
            'description' => 'Gateway invoice item',
            'related_type' => null,
            'related_id' => null,
            'billing_cycle' => 'monthly',
            'billing_period_starts_at' => now()->startOfMonth(),
            'billing_period_ends_at' => now()->endOfMonth(),
            'quantity' => 1,
            'unit_price_minor' => 1500,
            'subtotal_minor' => 1500,
            'discount_amount_minor' => 0,
            'tax_amount_minor' => 0,
            'total_minor' => 1500,
            'metadata' => null,
        ]);

        return [$tenant, $user, $invoice, $client];
    }

    private function createPortalUser(Tenant $tenant, Client $client): User
    {
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'gateway-portal@example.test',
        ]);

        $role = Role::query()->where('name', Role::CLIENT_USER)->firstOrFail();
        $user->roles()->attach($role);

        TenantUser::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'is_primary' => false,
            'joined_at' => now(),
        ]);

        $client->forceFill([
            'user_id' => $user->id,
        ])->save();

        return $user;
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
