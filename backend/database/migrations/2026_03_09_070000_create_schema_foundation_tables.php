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
        Schema::create('taxes', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->integer('rate');
            $table->char('country', 2)->nullable();
            $table->string('state', 100)->nullable();
            $table->timestampsTz();

            $table->index(['tenant_id', 'country', 'state']);
        });

        Schema::create('coupons', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('code', 100);
            $table->string('type', 50);
            $table->integer('value');
            $table->integer('max_uses')->nullable();
            $table->integer('uses_count')->default(0);
            $table->timestampTz('expires_at')->nullable();
            $table->jsonb('product_restrictions')->nullable();
            $table->timestampsTz();

            $table->unique(['tenant_id', 'code']);
            $table->index(['tenant_id', 'expires_at']);
        });

        Schema::create('coupon_usages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('order_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('client_id')->constrained()->cascadeOnDelete();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['coupon_id', 'client_id']);
        });

        Schema::create('subscriptions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('client_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('service_id')->constrained('services')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->string('billing_cycle', 50);
            $table->integer('price');
            $table->char('currency', 3)->default('USD');
            $table->string('status', 50)->default('active');
            $table->date('next_billing_date');
            $table->timestampTz('last_billed_at')->nullable();
            $table->integer('grace_period_days')->default(3);
            $table->boolean('auto_renew')->default(true);
            $table->text('cancellation_reason')->nullable();
            $table->timestampTz('cancelled_at')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'next_billing_date']);
        });

        Schema::create('credit_balances', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('client_id')->constrained()->cascadeOnDelete();
            $table->integer('amount');
            $table->char('currency', 3)->default('USD');
            $table->text('description');
            $table->foreignUuid('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['tenant_id', 'client_id']);
        });

        Schema::create('panel_metadata', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('server_id')->constrained('servers')->cascadeOnDelete();
            $table->string('key', 255);
            $table->jsonb('value')->nullable();
            $table->timestampTz('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['server_id', 'key']);
        });

        Schema::create('notification_templates', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('event', 255);
            $table->string('locale', 10);
            $table->string('subject', 500);
            $table->text('body_html');
            $table->text('body_text')->nullable();
            $table->boolean('is_enabled')->default(true);
            $table->timestampsTz();

            $table->unique(['tenant_id', 'event', 'locale']);
        });

        Schema::create('email_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('to_email', 255);
            $table->string('subject', 500);
            $table->string('event', 255)->nullable();
            $table->string('status', 50);
            $table->text('error_message')->nullable();
            $table->timestampTz('sent_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['tenant_id', 'status']);
        });

        Schema::create('scheduled_task_logs', function (Blueprint $table): void {
            $table->id();
            $table->string('task_class', 255);
            $table->string('status', 50);
            $table->timestampTz('started_at');
            $table->timestampTz('completed_at')->nullable();
            $table->integer('duration_ms')->nullable();
            $table->text('output')->nullable();
            $table->text('error_message')->nullable();

            $table->index(['task_class', 'status']);
        });

        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('action', 255);
            $table->string('model_type', 255);
            $table->uuid('model_id');
            $table->jsonb('before')->nullable();
            $table->jsonb('after')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['tenant_id', 'model_type', 'model_id']);
            $table->index(['tenant_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('scheduled_task_logs');
        Schema::dropIfExists('email_logs');
        Schema::dropIfExists('notification_templates');
        Schema::dropIfExists('panel_metadata');
        Schema::dropIfExists('credit_balances');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('coupon_usages');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('taxes');
    }
};
