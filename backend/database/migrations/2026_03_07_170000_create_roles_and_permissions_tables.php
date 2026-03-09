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
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
            $table->string('name');
            $table->string('guard_name')->default('web');
            $table->string('display_name');
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(true);
            $table->timestampsTz();

            $table->unique(['tenant_id', 'name']);
            $table->index(['tenant_id', 'guard_name']);
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->string('name');
            $table->string('guard_name')->default('web');
            $table->string('display_name');
            $table->text('description')->nullable();
            $table->timestampsTz();
            $table->index(['tenant_id', 'guard_name']);
        });

        DB::statement('CREATE UNIQUE INDEX permissions_platform_name_guard_unique ON permissions (name, guard_name) WHERE tenant_id IS NULL');
        DB::statement('CREATE UNIQUE INDEX permissions_tenant_name_guard_unique ON permissions (tenant_id, name, guard_name) WHERE tenant_id IS NOT NULL');

        Schema::create('permission_role', function (Blueprint $table) {
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->timestampsTz();

            $table->primary(['role_id', 'permission_id']);
        });

        Schema::create('role_user', function (Blueprint $table) {
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->timestampsTz();

            $table->primary(['role_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_user');
        Schema::dropIfExists('permission_role');
        DB::statement('DROP INDEX IF EXISTS permissions_tenant_name_guard_unique');
        DB::statement('DROP INDEX IF EXISTS permissions_platform_name_guard_unique');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
