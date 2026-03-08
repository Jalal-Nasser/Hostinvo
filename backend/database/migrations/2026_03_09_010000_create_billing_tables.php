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
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('client_id')->constrained()->cascadeOnDelete();
            $table->uuid('subscription_id')->nullable();
            $table->foreignUuid('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('reference_number', 64);
            $table->string('status', 32)->default('draft');
            $table->string('currency', 3)->default('USD');
            $table->date('issue_date')->nullable();
            $table->date('due_date')->nullable();
            $table->timestampTz('paid_at')->nullable();
            $table->timestampTz('cancelled_at')->nullable();
            $table->timestampTz('refunded_at')->nullable();
            $table->string('recurring_cycle', 32)->nullable();
            $table->date('next_invoice_date')->nullable();
            $table->string('discount_type', 32)->nullable();
            $table->integer('discount_value')->default(0);
            $table->bigInteger('discount_amount_minor')->default(0);
            $table->bigInteger('credit_applied_minor')->default(0);
            $table->integer('tax_rate_bps')->default(0);
            $table->bigInteger('tax_amount_minor')->default(0);
            $table->bigInteger('subtotal_minor')->default(0);
            $table->bigInteger('total_minor')->default(0);
            $table->bigInteger('amount_paid_minor')->default(0);
            $table->bigInteger('refunded_amount_minor')->default(0);
            $table->bigInteger('balance_due_minor')->default(0);
            $table->text('notes')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->unique(['tenant_id', 'reference_number']);
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'client_id']);
            $table->index(['tenant_id', 'order_id']);
            $table->index(['tenant_id', 'due_date']);
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_item_id')->nullable()->constrained()->nullOnDelete();
            $table->string('item_type', 32)->default('manual');
            $table->string('description');
            $table->string('related_type', 64)->nullable();
            $table->uuid('related_id')->nullable();
            $table->string('billing_cycle', 32)->nullable();
            $table->date('billing_period_starts_at')->nullable();
            $table->date('billing_period_ends_at')->nullable();
            $table->integer('quantity')->default(1);
            $table->bigInteger('unit_price_minor')->default(0);
            $table->bigInteger('subtotal_minor')->default(0);
            $table->bigInteger('discount_amount_minor')->default(0);
            $table->bigInteger('tax_amount_minor')->default(0);
            $table->bigInteger('total_minor')->default(0);
            $table->jsonb('metadata')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->softDeletesTz();

            $table->index(['tenant_id', 'invoice_id']);
            $table->index(['tenant_id', 'order_item_id']);
            $table->index(['tenant_id', 'related_type', 'related_id']);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('client_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 32)->default('payment');
            $table->string('status', 32)->default('completed');
            $table->string('payment_method', 64)->default('manual');
            $table->string('currency', 3)->default('USD');
            $table->bigInteger('amount_minor')->default(0);
            $table->string('reference', 120)->nullable();
            $table->timestampTz('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestampsTz();

            $table->index(['tenant_id', 'invoice_id']);
            $table->index(['tenant_id', 'client_id']);
            $table->index(['tenant_id', 'type', 'status']);
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('payment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('client_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 32)->default('payment');
            $table->string('status', 32)->default('completed');
            $table->string('gateway', 64)->default('manual');
            $table->string('external_reference', 120)->nullable();
            $table->string('currency', 3)->default('USD');
            $table->bigInteger('amount_minor')->default(0);
            $table->timestampTz('occurred_at')->nullable();
            $table->jsonb('request_payload')->nullable();
            $table->jsonb('response_payload')->nullable();
            $table->timestampsTz();

            $table->index(['tenant_id', 'invoice_id']);
            $table->index(['tenant_id', 'payment_id']);
            $table->index(['tenant_id', 'type', 'status']);
            $table->index(['tenant_id', 'gateway', 'external_reference']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
    }
};
