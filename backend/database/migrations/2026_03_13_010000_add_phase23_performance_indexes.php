<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('CREATE INDEX IF NOT EXISTS subscriptions_tenant_client_idx ON subscriptions (tenant_id, client_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS services_tenant_next_due_date_idx ON services (tenant_id, next_due_date)');
        DB::statement('CREATE INDEX IF NOT EXISTS services_tenant_status_next_due_date_idx ON services (tenant_id, status, next_due_date)');
        DB::statement('CREATE INDEX IF NOT EXISTS tickets_tenant_status_idx ON tickets (tenant_id, status)');
        DB::statement('CREATE INDEX IF NOT EXISTS tickets_tenant_client_idx ON tickets (tenant_id, client_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS tickets_tenant_status_last_reply_idx ON tickets (tenant_id, status, last_reply_at)');

        DB::statement("
            CREATE INDEX IF NOT EXISTS invoices_tenant_due_open_partial_idx
            ON invoices (tenant_id, due_date)
            WHERE deleted_at IS NULL
              AND status IN ('unpaid', 'overdue')
        ");

        DB::statement("
            CREATE INDEX IF NOT EXISTS subscriptions_tenant_renewal_due_partial_idx
            ON subscriptions (tenant_id, next_billing_date)
            WHERE deleted_at IS NULL
              AND status = 'active'
              AND auto_renew = true
        ");

        DB::statement("
            CREATE INDEX IF NOT EXISTS services_tenant_due_active_partial_idx
            ON services (tenant_id, next_due_date)
            WHERE deleted_at IS NULL
              AND status IN ('active', 'suspended')
        ");

        DB::statement("
            CREATE INDEX IF NOT EXISTS tickets_tenant_open_queue_partial_idx
            ON tickets (tenant_id, last_reply_at DESC)
            WHERE deleted_at IS NULL
              AND closed_at IS NULL
        ");

        DB::statement("
            CREATE INDEX IF NOT EXISTS domains_tenant_active_expiry_partial_idx
            ON domains (tenant_id, expiry_date)
            WHERE deleted_at IS NULL
              AND status = 'active'
        ");

        DB::statement("
            CREATE INDEX IF NOT EXISTS orders_tenant_active_status_partial_idx
            ON orders (tenant_id, created_at DESC)
            WHERE deleted_at IS NULL
              AND status IN ('draft', 'pending', 'accepted')
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS orders_tenant_active_status_partial_idx');
        DB::statement('DROP INDEX IF EXISTS domains_tenant_active_expiry_partial_idx');
        DB::statement('DROP INDEX IF EXISTS tickets_tenant_open_queue_partial_idx');
        DB::statement('DROP INDEX IF EXISTS services_tenant_due_active_partial_idx');
        DB::statement('DROP INDEX IF EXISTS subscriptions_tenant_renewal_due_partial_idx');
        DB::statement('DROP INDEX IF EXISTS invoices_tenant_due_open_partial_idx');

        DB::statement('DROP INDEX IF EXISTS tickets_tenant_status_last_reply_idx');
        DB::statement('DROP INDEX IF EXISTS tickets_tenant_client_idx');
        DB::statement('DROP INDEX IF EXISTS tickets_tenant_status_idx');
        DB::statement('DROP INDEX IF EXISTS services_tenant_status_next_due_date_idx');
        DB::statement('DROP INDEX IF EXISTS services_tenant_next_due_date_idx');
        DB::statement('DROP INDEX IF EXISTS subscriptions_tenant_client_idx');
    }
};
