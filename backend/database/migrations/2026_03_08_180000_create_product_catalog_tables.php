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
        Schema::create('product_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('status', 32)->default('active');
            $table->string('visibility', 32)->default('public');
            $table->integer('display_order')->default(0);
            $table->integer('sort_order')->default(0);
            $table->timestampsTz();

            $table->unique(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'status', 'visibility', 'display_order']);
        });

        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('product_group_id')->nullable()->constrained('product_groups')->nullOnDelete();
            $table->string('type', 32)->default('hosting');
            $table->string('name');
            $table->string('slug');
            $table->string('sku')->nullable();
            $table->string('summary')->nullable();
            $table->text('description')->nullable();
            $table->string('status', 32)->default('draft');
            $table->string('visibility', 32)->default('public');
            $table->integer('display_order')->default(0);
            $table->boolean('is_featured')->default(false);
            $table->text('welcome_email')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->unique(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'product_group_id']);
            $table->index(['tenant_id', 'type', 'status', 'visibility', 'display_order']);
        });

        Schema::create('product_pricing', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('billing_cycle', 32);
            $table->string('currency', 3)->default('USD');
            $table->integer('price')->default(0);
            $table->integer('setup_fee')->default(0);
            $table->boolean('is_enabled')->default(false);
            $table->timestampsTz();

            $table->unique(['tenant_id', 'product_id', 'billing_cycle']);
            $table->index(['tenant_id', 'billing_cycle', 'is_enabled']);
        });

        Schema::create('configurable_options', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('name');
            $table->string('code');
            $table->string('option_type', 32)->default('select');
            $table->text('description')->nullable();
            $table->string('status', 32)->default('active');
            $table->boolean('is_required')->default(false);
            $table->integer('display_order')->default(0);
            $table->timestampsTz();

            $table->unique(['tenant_id', 'product_id', 'code']);
            $table->index(['tenant_id', 'product_id', 'status', 'display_order']);
        });

        Schema::create('configurable_option_values', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('option_id')->constrained('configurable_options')->cascadeOnDelete();
            $table->string('label');
            $table->string('value');
            $table->integer('price_modifier')->default(0);
            $table->boolean('is_default')->default(false);
            $table->integer('display_order')->default(0);
            $table->integer('sort_order')->default(0);
            $table->timestampsTz();

            $table->unique(['option_id', 'value']);
            $table->index(['tenant_id', 'option_id', 'display_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('configurable_option_values');
        Schema::dropIfExists('configurable_options');
        Schema::dropIfExists('product_pricing');
        Schema::dropIfExists('products');
        Schema::dropIfExists('product_groups');
    }
};
