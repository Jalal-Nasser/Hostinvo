<?php

namespace Tests\Feature\Performance;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DatabaseIndexOptimizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_phase_23_indexes_exist_on_postgresql(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Index verification is PostgreSQL-specific.');
        }

        $indexNames = collect(DB::select("
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = current_schema()
        "))->map(fn (object $row): string => (string) $row->indexname)->all();

        $expectedIndexes = [
            'subscriptions_tenant_client_idx',
            'services_tenant_next_due_date_idx',
            'services_tenant_status_next_due_date_idx',
            'tickets_tenant_status_idx',
            'tickets_tenant_client_idx',
            'tickets_tenant_status_last_reply_idx',
            'invoices_tenant_due_open_partial_idx',
            'subscriptions_tenant_renewal_due_partial_idx',
            'services_tenant_due_active_partial_idx',
            'tickets_tenant_open_queue_partial_idx',
            'domains_tenant_active_expiry_partial_idx',
            'orders_tenant_active_status_partial_idx',
        ];

        foreach ($expectedIndexes as $indexName) {
            $this->assertContains($indexName, $indexNames);
        }
    }
}
