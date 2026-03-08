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
        Schema::create('tenant_settings', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('key', 255);
            $table->text('value')->nullable();
            $table->boolean('is_encrypted')->default(false);
            $table->timestampsTz();

            $table->unique(['tenant_id', 'key']);
            $table->index(['tenant_id', 'created_at']);
        });

        Schema::create('webhook_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('gateway', 64);
            $table->string('event_type', 191)->nullable();
            $table->string('status', 32)->default('received');
            $table->string('external_reference', 191)->nullable();
            $table->string('signature', 512)->nullable();
            $table->jsonb('request_headers')->nullable();
            $table->jsonb('payload')->nullable();
            $table->timestampTz('processed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestampsTz();

            $table->index(['tenant_id', 'gateway', 'status']);
            $table->index(['gateway', 'external_reference']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webhook_logs');
        Schema::dropIfExists('tenant_settings');
    }
};
