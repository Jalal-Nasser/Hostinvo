<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('server_groups', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('selection_strategy', 32)->default('least_accounts');
            $table->string('fill_type', 50)->default('least_accounts');
            $table->string('status', 32)->default('active');
            $table->text('notes')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index(['tenant_id', 'status']);
            $table->unique(['tenant_id', 'name']);
        });

        Schema::create('servers', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('server_group_id')->nullable()->constrained('server_groups')->nullOnDelete();
            $table->string('name', 120);
            $table->string('hostname', 191);
            $table->string('panel_type', 32);
            $table->string('api_endpoint', 255);
            $table->text('api_token')->nullable();
            $table->text('api_secret')->nullable();
            $table->unsignedInteger('api_port')->nullable();
            $table->string('status', 32)->default('active');
            $table->boolean('ssl_verify')->default(true);
            $table->unsignedInteger('max_accounts')->nullable();
            $table->unsignedInteger('account_count')->default(0);
            $table->string('username', 120)->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->timestampTz('last_tested_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index(['tenant_id', 'panel_type', 'status']);
            $table->index(['tenant_id', 'server_group_id', 'status']);
            $table->unique(['tenant_id', 'hostname']);
        });

        Schema::create('server_packages', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('server_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->string('panel_package_name', 191);
            $table->string('display_name', 191)->nullable();
            $table->boolean('is_default')->default(false);
            $table->jsonb('metadata')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index(['tenant_id', 'server_id']);
            $table->unique(['tenant_id', 'server_id', 'product_id']);
        });

        Schema::create('services', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('client_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('server_id')->nullable()->constrained('servers')->nullOnDelete();
            $table->foreignId('server_package_id')->nullable()->constrained('server_packages')->nullOnDelete();
            $table->string('reference_number', 64);
            $table->string('service_type', 32)->default('hosting');
            $table->string('status', 32)->default('pending');
            $table->string('provisioning_state', 32)->default('idle');
            $table->string('billing_cycle', 32)->nullable();
            $table->integer('price')->default(0);
            $table->string('currency', 3)->default('USD');
            $table->string('domain', 191)->nullable();
            $table->string('username', 120)->nullable();
            $table->string('external_reference', 191)->nullable();
            $table->string('last_operation', 64)->nullable();
            $table->date('registration_date')->nullable();
            $table->date('next_due_date')->nullable();
            $table->date('termination_date')->nullable();
            $table->timestampTz('activated_at')->nullable();
            $table->timestampTz('suspended_at')->nullable();
            $table->timestampTz('terminated_at')->nullable();
            $table->timestampTz('last_synced_at')->nullable();
            $table->text('notes')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'client_id']);
            $table->index(['tenant_id', 'server_id']);
            $table->unique(['tenant_id', 'reference_number']);
        });

        Schema::create('service_credentials', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('service_id')->constrained('services')->cascadeOnDelete();
            $table->string('key', 100)->default('primary');
            $table->text('value')->nullable();
            $table->text('credentials')->nullable();
            $table->string('control_panel_url', 255)->nullable();
            $table->string('access_url', 255)->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestampsTz();

            $table->unique(['tenant_id', 'service_id', 'key']);
        });

        Schema::create('service_usage', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('service_id')->constrained('services')->cascadeOnDelete();
            $table->unsignedInteger('disk_used_mb')->default(0);
            $table->unsignedInteger('disk_limit_mb')->nullable();
            $table->unsignedInteger('bandwidth_used_mb')->default(0);
            $table->unsignedInteger('bandwidth_limit_mb')->nullable();
            $table->unsignedInteger('inodes_used')->default(0);
            $table->unsignedInteger('email_accounts_used')->default(0);
            $table->unsignedInteger('databases_used')->default(0);
            $table->timestampTz('synced_at')->useCurrent();
            $table->timestampTz('last_synced_at')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestampsTz();

            $table->unique(['tenant_id', 'service_id']);
            $table->index(['tenant_id', 'last_synced_at']);
        });

        Schema::create('service_suspensions', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('service_id')->constrained('services')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('suspended_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reason')->nullable();
            $table->timestampTz('suspended_at');
            $table->timestampTz('unsuspended_at')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['tenant_id', 'service_id', 'suspended_at']);
        });

        Schema::create('provisioning_jobs', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('service_id')->constrained('services')->cascadeOnDelete();
            $table->foreignId('server_id')->nullable()->constrained('servers')->nullOnDelete();
            $table->foreignUuid('requested_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('operation', 64);
            $table->string('status', 32)->default('queued');
            $table->string('driver', 64)->nullable();
            $table->string('queue_name', 32)->default('critical');
            $table->unsignedInteger('attempts')->default(0);
            $table->jsonb('payload')->nullable();
            $table->jsonb('result_payload')->nullable();
            $table->text('error_message')->nullable();
            $table->timestampTz('requested_at');
            $table->timestampTz('started_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampTz('failed_at')->nullable();
            $table->timestampsTz();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'service_id', 'status']);
            $table->index(['tenant_id', 'operation', 'requested_at']);
        });

        Schema::create('provisioning_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('provisioning_job_id')->nullable()->constrained('provisioning_jobs')->nullOnDelete();
            $table->foreignUuid('service_id')->nullable()->constrained('services')->nullOnDelete();
            $table->foreignId('server_id')->nullable()->constrained('servers')->nullOnDelete();
            $table->string('operation', 64);
            $table->string('status', 32);
            $table->string('driver', 64)->nullable();
            $table->text('message')->nullable();
            $table->jsonb('request_payload')->nullable();
            $table->jsonb('response_payload')->nullable();
            $table->text('error_message')->nullable();
            $table->integer('duration_ms')->nullable();
            $table->timestampTz('occurred_at');
            $table->timestampsTz();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'service_id', 'occurred_at']);
            $table->index(['tenant_id', 'operation', 'occurred_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('provisioning_logs');
        Schema::dropIfExists('provisioning_jobs');
        Schema::dropIfExists('service_suspensions');
        Schema::dropIfExists('service_usage');
        Schema::dropIfExists('service_credentials');
        Schema::dropIfExists('services');
        Schema::dropIfExists('server_packages');
        Schema::dropIfExists('servers');
        Schema::dropIfExists('server_groups');
    }
};
