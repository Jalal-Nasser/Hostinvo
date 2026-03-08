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
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('client_id')->constrained('clients')->restrictOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reference_number', 64);
            $table->string('status', 32)->default('draft');
            $table->string('currency', 3);
            $table->unsignedBigInteger('coupon_id')->nullable();
            $table->string('coupon_code', 100)->nullable();
            $table->string('discount_type', 32)->nullable();
            $table->integer('discount_value')->default(0);
            $table->bigInteger('discount_amount_minor')->default(0);
            $table->integer('tax_rate_bps')->default(0);
            $table->bigInteger('tax_amount_minor')->default(0);
            $table->bigInteger('subtotal_minor')->default(0);
            $table->bigInteger('total_minor')->default(0);
            $table->text('notes')->nullable();
            $table->timestampTz('placed_at')->nullable();
            $table->timestampTz('accepted_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampTz('cancelled_at')->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            $table->unique(['tenant_id', 'reference_number']);
            $table->index(['tenant_id', 'status', 'created_at']);
            $table->index(['tenant_id', 'client_id', 'status']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignUuid('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('product_name');
            $table->string('product_type', 32);
            $table->string('billing_cycle', 32);
            $table->integer('quantity')->default(1);
            $table->bigInteger('unit_price_minor')->default(0);
            $table->bigInteger('setup_fee_minor')->default(0);
            $table->bigInteger('discount_amount_minor')->default(0);
            $table->bigInteger('subtotal_minor')->default(0);
            $table->bigInteger('total_minor')->default(0);
            $table->jsonb('product_snapshot')->nullable();
            $table->jsonb('configurable_options')->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            $table->index(['tenant_id', 'order_id']);
            $table->index(['tenant_id', 'product_id', 'billing_cycle']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
