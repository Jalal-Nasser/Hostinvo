<?php

namespace Tests\Feature\Payments;

use App\Contracts\Repositories\Auth\TenantRepositoryInterface;
use App\Jobs\Automation\PurgeWebhookLogs;
use App\Models\Tenant;
use App\Models\WebhookLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
