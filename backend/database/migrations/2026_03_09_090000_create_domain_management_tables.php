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
        Schema::create('domains', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('client_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('service_id')->nullable()->constrained('services')->nullOnDelete();
            $table->string('domain', 255);
            $table->string('tld', 50);
            $table->string('status', 50)->default('active');
            $table->string('registrar', 100)->nullable();
            $table->date('registration_date')->nullable();
            $table->date('expiry_date');
            $table->boolean('auto_renew')->default(true);
            $table->boolean('dns_management')->default(false);
            $table->boolean('id_protection')->default(false);
            $table->integer('renewal_price')->nullable();
            $table->string('currency', 3)->default('USD');
            $table->text('notes')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->unique(['tenant_id', 'domain']);
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'expiry_date']);
            $table->index(['tenant_id', 'client_id']);
            $table->index(['tenant_id', 'service_id']);
        });

        Schema::create('domain_contacts', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('domain_id')->constrained('domains')->cascadeOnDelete();
            $table->string('type', 50);
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email');
            $table->string('phone', 50)->nullable();
            $table->jsonb('address');
            $table->timestampsTz();

            $table->index(['tenant_id', 'domain_id']);
            $table->unique(['tenant_id', 'domain_id', 'type']);
        });

        Schema::create('domain_renewals', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('domain_id')->constrained('domains')->cascadeOnDelete();
            $table->unsignedSmallInteger('years')->default(1);
            $table->integer('price');
            $table->string('status', 50);
            $table->timestampTz('renewed_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['tenant_id', 'domain_id']);
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('registrar_logs', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('domain_id')->constrained('domains')->cascadeOnDelete();
            $table->string('operation', 100);
            $table->string('status', 50);
            $table->jsonb('request_payload')->nullable();
            $table->jsonb('response_payload')->nullable();
            $table->text('error_message')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['tenant_id', 'domain_id']);
            $table->index(['tenant_id', 'operation']);
            $table->index(['tenant_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registrar_logs');
        Schema::dropIfExists('domain_renewals');
        Schema::dropIfExists('domain_contacts');
        Schema::dropIfExists('domains');
    }
};
