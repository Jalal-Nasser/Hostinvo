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
        Schema::table('licenses', function (Blueprint $table): void {
            if (! Schema::hasColumn('licenses', 'type')) {
                $table->string('type', 50)->nullable()->after('owner_email');
                $table->index(['type', 'status'], 'licenses_type_status_idx');
            }

            if (! Schema::hasColumn('licenses', 'domain')) {
                $table->string('domain', 255)->nullable()->after('status');
                $table->index('domain', 'licenses_domain_idx');
            }

            if (! Schema::hasColumn('licenses', 'installation_hash')) {
                $table->string('installation_hash', 191)->nullable()->after('domain');
                $table->index('installation_hash', 'licenses_installation_hash_idx');
            }
        });

        DB::statement('UPDATE licenses SET type = COALESCE(type, license_type, plan)');
        DB::statement('UPDATE licenses SET domain = COALESCE(domain, bound_domain)');
        DB::statement('UPDATE licenses SET installation_hash = COALESCE(installation_hash, instance_fingerprint)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('licenses', function (Blueprint $table): void {
            if (Schema::hasColumn('licenses', 'installation_hash')) {
                $table->dropIndex('licenses_installation_hash_idx');
                $table->dropColumn('installation_hash');
            }

            if (Schema::hasColumn('licenses', 'domain')) {
                $table->dropIndex('licenses_domain_idx');
                $table->dropColumn('domain');
            }

            if (Schema::hasColumn('licenses', 'type')) {
                $table->dropIndex('licenses_type_status_idx');
                $table->dropColumn('type');
            }
        });
    }
};
