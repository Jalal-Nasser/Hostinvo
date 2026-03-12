<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('licenses', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->string('license_key', 120)->unique();
            $table->string('owner_email', 255);
            $table->string('plan', 50);
            $table->string('status', 32)->default('active');
            $table->integer('max_clients')->nullable();
            $table->integer('max_services')->nullable();
            $table->unsignedInteger('activation_limit')->nullable();
            $table->timestampTz('issued_at');
            $table->timestampTz('expires_at')->nullable();
            $table->timestampTz('last_validated_at')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['status', 'plan']);
            $table->index(['owner_email', 'status']);
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('license_activations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('license_id')->constrained('licenses')->cascadeOnDelete();
            $table->foreignUuid('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->string('domain', 255);
            $table->string('instance_id', 191);
            $table->string('status', 32)->default('active');
            $table->timestampTz('activated_at')->useCurrent();
            $table->timestampTz('last_seen_at')->nullable();
            $table->timestampTz('deactivated_at')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestampsTz();

            $table->unique(['license_id', 'instance_id']);
            $table->index(['license_id', 'status']);
            $table->index(['license_id', 'domain']);
            $table->index(['tenant_id', 'status']);
            $table->index(['domain', 'status']);
        });

        DB::statement("
            CREATE INDEX IF NOT EXISTS license_activations_license_active_idx
            ON license_activations (license_id, activated_at)
            WHERE deactivated_at IS NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS license_activations_license_active_idx');

        Schema::dropIfExists('license_activations');
        Schema::dropIfExists('licenses');
    }
};
