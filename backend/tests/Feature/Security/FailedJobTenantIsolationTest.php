<?php

namespace Tests\Feature\Security;

use App\Models\Tenant;
use App\Services\Automation\FailedJobInspectionService;
use App\Support\Tenancy\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Fixtures\Jobs\FailingTenantAwareJob;
use Tests\TestCase;

class FailedJobTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'queue.default' => 'database',
            'queue.connections.database.queue' => 'default',
            'queue.failed.driver' => 'database-uuids',
            'queue.failed.table' => 'failed_jobs',
        ]);
    }

    public function test_job_failure_inside_tenant_a_stores_tenant_id_of_tenant_a(): void
    {
        $tenantA = $this->createTenant('failed-job-tenant-a');

        $this->dispatchFailingJobForTenant($tenantA, 'tenant-a failure');

        $failedRecord = DB::table('failed_jobs')
            ->where('tenant_id', $tenantA->id)
            ->orderByDesc('id')
            ->first();

        $this->assertNotNull($failedRecord);
        $this->assertSame($tenantA->id, $failedRecord->tenant_id);
    }

    public function test_job_failure_inside_tenant_b_stores_tenant_id_of_tenant_b(): void
    {
        $tenantB = $this->createTenant('failed-job-tenant-b');

        $this->dispatchFailingJobForTenant($tenantB, 'tenant-b failure');

        $failedRecord = DB::table('failed_jobs')
            ->where('tenant_id', $tenantB->id)
            ->orderByDesc('id')
            ->first();

        $this->assertNotNull($failedRecord);
        $this->assertSame($tenantB->id, $failedRecord->tenant_id);
    }

    public function test_tenant_a_cannot_read_tenant_b_failed_jobs(): void
    {
        $tenantA = $this->createTenant('failed-job-tenant-a-scope');
        $tenantB = $this->createTenant('failed-job-tenant-b-scope');

        $this->dispatchFailingJobForTenant($tenantA, 'tenant-a scoped failure');
        $this->dispatchFailingJobForTenant($tenantB, 'tenant-b scoped failure');

        $inspectionService = app(FailedJobInspectionService::class);

        $tenantAJobs = $inspectionService->listForTenant($tenantA->id);
        $tenantBJobs = $inspectionService->listForTenant($tenantB->id);

        $this->assertCount(1, $tenantAJobs);
        $this->assertCount(1, $tenantBJobs);
        $this->assertSame($tenantA->id, $tenantAJobs->first()->tenant_id);
        $this->assertSame($tenantB->id, $tenantBJobs->first()->tenant_id);

        $tenantBJobUuid = (string) $tenantBJobs->first()->uuid;
        $this->assertNull($inspectionService->findForTenant($tenantA->id, $tenantBJobUuid));

        $this->setTenantContext($tenantA);
        $scopedFailedJobs = app('queue.failer')->all();
        $this->clearTenantContext();

        $this->assertCount(1, $scopedFailedJobs);
        $this->assertSame($tenantA->id, $scopedFailedJobs[0]->tenant_id);
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
