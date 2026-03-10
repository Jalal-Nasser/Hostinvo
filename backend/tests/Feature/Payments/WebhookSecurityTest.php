<?php

namespace Tests\Feature\Payments;

use App\Contracts\Repositories\Auth\TenantRepositoryInterface;
use App\Jobs\Automation\PurgeWebhookLogs;
use App\Models\Tenant;
use App\Models\WebhookLog;
use App\Services\Tenancy\TenantSettingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Mockery\MockInterface;
use Tests\TestCase;

class WebhookSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_unknown_webhook_gateway_returns_not_found_and_does_not_iterate_tenants(): void
    {
        $this->mock(TenantRepositoryInterface::class, function (MockInterface $mock): void {
            $mock->shouldNotReceive('allActive');
        });

        $this->postJson('/api/v1/webhooks/unknown', [
            'event' => 'fake',
        ])->assertNotFound();

        $this->assertDatabaseCount('webhook_logs', 0);
    }

    public function test_stripe_webhook_with_invalid_signature_returns_bad_request(): void
    {
        $tenant = $this->createActiveTenant('stripe-webhook-tenant');
        $this->configureStripe($tenant);

        $this->postJson('/api/v1/webhooks/stripe', [
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_invalid_sig',
                ],
            ],
        ], [
            'Stripe-Signature' => 'v1=invalid_signature',
        ])->assertStatus(400)
            ->assertJsonPath('errors.0.message', 'Webhook verification failed.');

        $this->assertDatabaseCount('webhook_logs', 0);
    }

    public function test_stripe_webhook_with_missing_signature_header_returns_bad_request(): void
    {
        $tenant = $this->createActiveTenant('stripe-missing-signature-tenant');
        $this->configureStripe($tenant);

        $this->postJson('/api/v1/webhooks/stripe', [
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_missing_sig',
                ],
            ],
        ])->assertStatus(400)
            ->assertJsonPath('errors.0.message', 'Webhook verification failed.');
    }

    public function test_paypal_webhook_with_verification_failure_returns_bad_request(): void
    {
        $tenant = $this->createActiveTenant('paypal-webhook-tenant');
        $this->configurePayPal($tenant);

        Http::fake([
            'https://api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response([
                'access_token' => 'paypal-access-token',
            ], 200),
            'https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature' => Http::response([
                'verification_status' => 'FAILURE',
            ], 200),
        ]);

        $this->postJson('/api/v1/webhooks/paypal', [
            'id' => 'WH-TEST',
            'event_type' => 'PAYMENT.CAPTURE.COMPLETED',
            'resource' => [
                'id' => 'CAPTURE-TEST',
            ],
        ], [
            'paypal-auth-algo' => 'SHA256withRSA',
            'paypal-cert-url' => 'https://api-m.sandbox.paypal.com/certs/test',
            'paypal-transmission-id' => 'transmission-id',
            'paypal-transmission-sig' => 'invalid-signature',
            'paypal-transmission-time' => now()->toIso8601String(),
        ])->assertStatus(400)
            ->assertJsonPath('errors.0.message', 'Webhook verification failed.');

        $this->assertDatabaseCount('webhook_logs', 0);
    }

    public function test_purge_webhook_logs_job_deletes_records_older_than_ninety_days(): void
    {
        $tenant = Tenant::query()->create([
            'name' => 'Webhook Tenant',
            'slug' => 'webhook-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $oldLogId = WebhookLog::query()->insertGetId([
            'tenant_id' => $tenant->id,
            'gateway' => 'stripe',
            'event_type' => 'checkout.session.completed',
            'status' => WebhookLog::STATUS_PROCESSED,
            'external_reference' => 'old-ref',
            'signature' => 'old-signature',
            'request_headers' => json_encode(['x-test' => ['old']], JSON_THROW_ON_ERROR),
            'payload' => json_encode(['id' => 'old'], JSON_THROW_ON_ERROR),
            'processed_at' => now()->subDays(91),
            'error_message' => null,
            'created_at' => now()->subDays(91),
            'updated_at' => now()->subDays(91),
        ]);

        $recentLogId = WebhookLog::query()->insertGetId([
            'tenant_id' => $tenant->id,
            'gateway' => 'paypal',
            'event_type' => 'PAYMENT.CAPTURE.COMPLETED',
            'status' => WebhookLog::STATUS_PROCESSED,
            'external_reference' => 'recent-ref',
            'signature' => 'recent-signature',
            'request_headers' => json_encode(['x-test' => ['recent']], JSON_THROW_ON_ERROR),
            'payload' => json_encode(['id' => 'recent'], JSON_THROW_ON_ERROR),
            'processed_at' => now()->subDays(30),
            'error_message' => null,
            'created_at' => now()->subDays(30),
            'updated_at' => now()->subDays(30),
        ]);

        (new PurgeWebhookLogs())->handle();

        $this->assertDatabaseMissing('webhook_logs', [
            'id' => $oldLogId,
        ]);

        $this->assertDatabaseHas('webhook_logs', [
            'id' => $recentLogId,
        ]);
    }

    private function createActiveTenant(string $slug): Tenant
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
