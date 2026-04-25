<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table): void {
            $table->string('external_id', 191)->nullable()->after('external_reference');
            $table->index(['tenant_id', 'external_id']);
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table): void {
            $table->dropIndex(['tenant_id', 'external_id']);
            $table->dropColumn('external_id');
        });
    }
};
