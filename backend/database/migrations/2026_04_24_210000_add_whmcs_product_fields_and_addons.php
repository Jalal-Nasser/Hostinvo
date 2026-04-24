<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->string('tagline')->nullable()->after('name');
            $table->string('color', 32)->nullable()->after('description');
            $table->boolean('require_domain')->default(false)->after('welcome_email');
            $table->boolean('stock_control')->default(false)->after('require_domain');
            $table->unsignedInteger('stock_quantity')->nullable()->after('stock_control');
            $table->boolean('apply_tax')->default(false)->after('stock_quantity');
            $table->boolean('retired')->default(false)->after('apply_tax');
            $table->string('payment_type', 32)->default('recurring')->after('retired');
            $table->string('allow_multiple_quantities', 32)->default('no')->after('payment_type');
            $table->unsignedInteger('recurring_cycles_limit')->nullable()->after('allow_multiple_quantities');
            $table->unsignedInteger('auto_terminate_days')->nullable()->after('recurring_cycles_limit');
            $table->string('termination_email', 191)->nullable()->after('auto_terminate_days');
            $table->boolean('prorata_billing')->default(false)->after('termination_email');
            $table->unsignedTinyInteger('prorata_date')->nullable()->after('prorata_billing');
            $table->unsignedTinyInteger('charge_next_month')->nullable()->after('prorata_date');
        });

        Schema::create('product_addons', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('status', 32)->default('active');
            $table->string('visibility', 32)->default('visible');
            $table->boolean('apply_tax')->default(false);
            $table->boolean('auto_activate')->default(false);
            $table->text('welcome_email')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->unique(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'status', 'visibility']);
        });

        Schema::create('product_addon_pricing', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('product_addon_id')->constrained('product_addons')->cascadeOnDelete();
            $table->string('billing_cycle', 32);
            $table->string('currency', 3)->default('USD');
            $table->integer('price')->default(0);
            $table->integer('setup_fee')->default(0);
            $table->boolean('is_enabled')->default(false);
            $table->timestampsTz();

            $table->unique(['tenant_id', 'product_addon_id', 'billing_cycle']);
            $table->index(['tenant_id', 'billing_cycle', 'is_enabled']);
        });

        Schema::create('product_addon_products', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('product_addon_id')->constrained('product_addons')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->timestampsTz();

            $table->unique(['tenant_id', 'product_addon_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_addon_products');
        Schema::dropIfExists('product_addon_pricing');
        Schema::dropIfExists('product_addons');

        Schema::table('products', function (Blueprint $table): void {
            $table->dropColumn([
                'tagline',
                'color',
                'require_domain',
                'stock_control',
                'stock_quantity',
                'apply_tax',
                'retired',
                'payment_type',
                'allow_multiple_quantities',
                'recurring_cycles_limit',
                'auto_terminate_days',
                'termination_email',
                'prorata_billing',
                'prorata_date',
                'charge_next_month',
            ]);
        });
    }
};
