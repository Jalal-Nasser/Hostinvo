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
        $driver = Schema::getConnection()->getDriverName();

        Schema::table('failed_jobs', function (Blueprint $table): void {
            $table->uuid('tenant_id')->nullable()->after('uuid');
            $table->index('tenant_id', 'failed_jobs_tenant_id_index');
        });

        if ($driver !== 'sqlite') {
            Schema::table('failed_jobs', function (Blueprint $table): void {
                $table->foreign('tenant_id', 'failed_jobs_tenant_id_foreign')
                    ->references('id')
                    ->on('tenants')
                    ->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver !== 'sqlite') {
            Schema::table('failed_jobs', function (Blueprint $table): void {
                $table->dropForeign('failed_jobs_tenant_id_foreign');
            });
        }

        Schema::table('failed_jobs', function (Blueprint $table): void {
            $table->dropIndex('failed_jobs_tenant_id_index');
            $table->dropColumn('tenant_id');
        });
    }
};
