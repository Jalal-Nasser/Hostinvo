<?php

namespace Tests\Feature\Integration;

use App\Jobs\Provisioning\ProvisionAccountJob;
use App\Models\Client;
use App\Models\Product;
use App\Models\ProvisioningJob;
use App\Models\ProvisioningLog;
use App\Models\Role;
use App\Models\Server;
use App\Models\ServerPackage;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Automation\FailedJobInspectionService;
use App\Services\Provisioning\ProvisioningService;
use App\Support\Tenancy\CurrentTenant;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\Fixtures\Jobs\FailingTenantAwareJob;
use Tests\TestCase;

class QueueProcessingTest extends TestCase
{
    use RefreshDatabase;

    public function test_redis_queue_dispatch_and_provisioning_job_processing_flow(): void
    {
        $this->seed(RolePermissionSeeder::class);

        config([
            'queue.default' => 'redis',
            'queue.connections.redis.queue' => 'default',
            'provisioning.queue.name' => 'critical',
        ]);

        Queue::fake();

        Http::fake([
            '*' => Http::response([
                'metadata' => [
                    'result' => 1,
                    'reason' => 'OK',
                    'command' => 'createacct',
                ],
                'data' => [
                    'user' => 'queuecustomer',
                    'domain' => 'queue-customer.example.test',
                    'ip' => '127.0.0.1',
                ],
            ], 200),
        ]);

        $tenant = $this->createTenant('integration-queue-processing');
        $tenantAdmin = $this->createTenantAdmin($tenant, 'integration-queue-admin@example.test');

        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Queue Processing Client',
            'email' => 'queue-processing-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $product = Product::query()->create([
            'tenant_id' => $tenant->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Queue Plan',
            'slug' => 'queue-plan',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_PUBLIC,
            'display_order' => 0,
            'is_featured' => false,
        ]);

        $server = Server::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'name' => 'Queue Server',
            'hostname' => 'queue-server.example.test',
            'panel_type' => Server::PANEL_CPANEL,
            'api_endpoint' => 'https://queue-server.example.test:2087',
            'api_port' => 2087,
            'status' => Server::STATUS_ACTIVE,
            'ssl_verify' => true,
            'max_accounts' => 100,
            'account_count' => 0,
            'username' => 'root',
            'credentials' => [
                'api_token' => 'queue-server-token',
            ],
        ]);

        ServerPackage::query()->create([
            'tenant_id' => $tenant->id,
            'server_id' => $server->id,
            'product_id' => $product->id,
            'panel_package_name' => 'queue_package',
            'display_name' => 'Queue Package',
            'is_default' => true,
        ]);

        Sanctum::actingAs($tenantAdmin);

        $serviceResponse = $this->postJson('/api/v1/admin/services', [
            'client_id' => $client->id,
            'product_id' => $product->id,
            'server_id' => $server->id,
            'billing_cycle' => 'monthly',
            'service_type' => Service::TYPE_HOSTING,
            'status' => Service::STATUS_PENDING,
            'provisioning_state' => Service::PROVISIONING_IDLE,
            'domain' => 'queue-customer.example.test',
            'username' => 'queuecustomer',
            'notes' => 'Queue integration service.',
        ])->assertCreated();

        $serviceId = $serviceResponse->json('data.id');

        $dispatchResponse = $this->postJson("/api/v1/admin/services/{$serviceId}/operations/create_account", [
            'payload' => [],
        ])->assertAccepted();

        $jobId = $dispatchResponse->json('data.id');

        Queue::assertPushed(ProvisionAccountJob::class, function (ProvisionAccountJob $job): bool {
            return $job->serviceId !== '';
        });

        $this->assertDatabaseHas('provisioning_jobs', [
            'id' => $jobId,
            'service_id' => $serviceId,
            'status' => ProvisioningJob::STATUS_QUEUED,
        ]);

        app(ProvisioningService::class)->processCreateAccountForService($serviceId, 1);

        $this->assertDatabaseHas('provisioning_jobs', [
            'id' => $jobId,
            'status' => ProvisioningJob::STATUS_COMPLETED,
        ]);

        $this->assertDatabaseHas('provisioning_logs', [
            'service_id' => $serviceId,
            'operation' => ProvisioningJob::OPERATION_CREATE_ACCOUNT,
            'status' => ProvisioningLog::STATUS_COMPLETED,
        ]);

        $this->assertDatabaseHas('services', [
            'id' => $serviceId,
            'status' => Service::STATUS_ACTIVE,
            'provisioning_state' => Service::PROVISIONING_SYNCED,
        ]);
    }

    public function test_failed_jobs_logging_keeps_tenant_context_isolated(): void
    {
        config([
            'queue.default' => 'database',
            'queue.connections.database.queue' => 'default',
            'queue.failed.driver' => 'database-uuids',
            'queue.failed.table' => 'failed_jobs',
        ]);

        $tenantA = $this->createTenant('integration-failed-jobs-tenant-a');
        $tenantB = $this->createTenant('integration-failed-jobs-tenant-b');

        $this->dispatchFailingJobForTenant($tenantA, 'integration failure tenant A');
        $this->dispatchFailingJobForTenant($tenantB, 'integration failure tenant B');

        $this->assertDatabaseHas('failed_jobs', [
            'tenant_id' => $tenantA->id,
        ]);

        $this->assertDatabaseHas('failed_jobs', [
            'tenant_id' => $tenantB->id,
        ]);

        $inspection = app(FailedJobInspectionService::class);
        $tenantAJobs = $inspection->listForTenant($tenantA->id);
        $tenantBJobs = $inspection->listForTenant($tenantB->id);

        $this->assertCount(1, $tenantAJobs);
        $this->assertCount(1, $tenantBJobs);
        $this->assertSame($tenantA->id, $tenantAJobs->first()->tenant_id);
        $this->assertSame($tenantB->id, $tenantBJobs->first()->tenant_id);
        $this->assertNull($inspection->findForTenant($tenantA->id, (string) $tenantBJobs->first()->uuid));
    }

    private function createTenant(string $slug): Tenant
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

    private function createTenantAdmin(Tenant $tenant, string $email): User
    {
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => $email,
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

        return $user;
    }

    private function dispatchFailingJobForTenant(Tenant $tenant, string $reason): void
    {
        $this->setTenantContext($tenant);
        FailingTenantAwareJob::dispatch($reason);
        $this->clearTenantContext();

        $this->artisan('queue:work', [
            'connection' => 'database',
            '--once' => true,
            '--queue' => 'default',
            '--tries' => 1,
            '--sleep' => 0,
        ])->run();
    }

    private function setTenantContext(Tenant $tenant): void
    {
        app(CurrentTenant::class)->set($tenant);
        app()->instance('tenant', $tenant);
    }

    private function clearTenantContext(): void
    {
        app(CurrentTenant::class)->clear();
        app()->forgetInstance('tenant');
    }
}
