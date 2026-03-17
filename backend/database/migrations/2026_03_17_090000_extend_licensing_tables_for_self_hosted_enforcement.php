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
        if (! Schema::hasColumn('licenses', 'license_type')) {
            Schema::table('licenses', function (Blueprint $table): void {
                $table->string('license_type', 50)->nullable()->after('owner_email');
                $table->string('bound_domain', 255)->nullable()->after('status');
                $table->string('instance_fingerprint', 191)->nullable()->after('bound_domain');
                $table->timestampTz('last_verified_at')->nullable()->after('last_validated_at');
                $table->timestampTz('verification_grace_ends_at')->nullable()->after('last_verified_at');

                $table->index(['license_type', 'status'], 'licenses_license_type_status_idx');
                $table->index('bound_domain', 'licenses_bound_domain_idx');
                $table->index('instance_fingerprint', 'licenses_instance_fingerprint_idx');
            });
        }

        if (! Schema::hasColumn('license_activations', 'instance_fingerprint')) {
            Schema::table('license_activations', function (Blueprint $table): void {
                $table->string('instance_fingerprint', 191)->nullable()->after('instance_id');

                $table->index('instance_fingerprint', 'license_activations_instance_fingerprint_idx');
            });
        }

        DB::statement('UPDATE licenses SET license_type = plan WHERE license_type IS NULL');
        DB::statement('UPDATE license_activations SET instance_fingerprint = instance_id WHERE instance_fingerprint IS NULL');
        DB::statement('UPDATE licenses SET last_verified_at = last_validated_at WHERE last_verified_at IS NULL AND last_validated_at IS NOT NULL');

        DB::statement(<<<'SQL'
            UPDATE licenses
            SET bound_domain = activation.domain,
                instance_fingerprint = activation.instance_fingerprint
            FROM (
                SELECT DISTINCT ON (license_id)
                    license_id,
                    domain,
                    instance_fingerprint
                FROM license_activations
                ORDER BY license_id, activated_at ASC
            ) AS activation
            WHERE licenses.id = activation.license_id
              AND (licenses.bound_domain IS NULL OR licenses.instance_fingerprint IS NULL)
        SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('license_activations', 'instance_fingerprint')) {
            Schema::table('license_activations', function (Blueprint $table): void {
                $table->dropIndex('license_activations_instance_fingerprint_idx');
                $table->dropColumn('instance_fingerprint');
            });
        }

        if (Schema::hasColumn('licenses', 'license_type')) {
            Schema::table('licenses', function (Blueprint $table): void {
                $table->dropIndex('licenses_license_type_status_idx');
                $table->dropIndex('licenses_bound_domain_idx');
                $table->dropIndex('licenses_instance_fingerprint_idx');
                $table->dropColumn([
                    'license_type',
                    'bound_domain',
                    'instance_fingerprint',
                    'last_verified_at',
                    'verification_grace_ends_at',
                ]);
            });
        }
    }
};
