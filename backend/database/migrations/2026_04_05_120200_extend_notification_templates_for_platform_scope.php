<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_templates', function (Blueprint $table): void {
            $table->dropUnique('notification_templates_tenant_id_event_locale_unique');
        });

        Schema::table('notification_templates', function (Blueprint $table): void {
            $table->uuid('tenant_id')->nullable()->change();
            $table->string('scope', 50)->default('tenant')->after('tenant_id');
        });

        DB::statement('CREATE UNIQUE INDEX notification_templates_tenant_scope_unique ON notification_templates (tenant_id, event, locale) WHERE tenant_id IS NOT NULL');
        DB::statement("CREATE UNIQUE INDEX notification_templates_platform_scope_unique ON notification_templates (event, locale, scope) WHERE tenant_id IS NULL");
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS notification_templates_tenant_scope_unique');
        DB::statement('DROP INDEX IF EXISTS notification_templates_platform_scope_unique');

        Schema::table('notification_templates', function (Blueprint $table): void {
            $table->dropColumn('scope');
        });

        Schema::table('notification_templates', function (Blueprint $table): void {
            $table->uuid('tenant_id')->nullable(false)->change();
            $table->unique(['tenant_id', 'event', 'locale']);
        });
    }
};
