<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->foreignId('server_id')->nullable()->after('product_group_id')->constrained('servers')->nullOnDelete();
            $table->string('provisioning_module', 32)->nullable()->after('type');
            $table->string('provisioning_package', 191)->nullable()->after('provisioning_module');
        });

        Schema::table('order_items', function (Blueprint $table): void {
            $table->string('domain', 191)->nullable()->after('billing_cycle');
        });

        Schema::table('services', function (Blueprint $table): void {
            $table->foreignId('order_item_id')->nullable()->after('order_id')->constrained('order_items')->nullOnDelete();
            $table->index(['tenant_id', 'order_item_id']);
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table): void {
            $table->dropIndex(['tenant_id', 'order_item_id']);
            $table->dropConstrainedForeignId('order_item_id');
        });

        Schema::table('order_items', function (Blueprint $table): void {
            $table->dropColumn('domain');
        });

        Schema::table('products', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('server_id');
            $table->dropColumn(['provisioning_module', 'provisioning_package']);
        });
    }
};
