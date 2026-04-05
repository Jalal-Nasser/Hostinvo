<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('email_verification_required')
                ->default(false)
                ->after('email_verified_at');
        });

        Schema::table('platform_settings', function (Blueprint $table): void {
            $table->boolean('is_encrypted')
                ->default(false)
                ->after('value');
        });
    }

    public function down(): void
    {
        Schema::table('platform_settings', function (Blueprint $table): void {
            $table->dropColumn('is_encrypted');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('email_verification_required');
        });
    }
};
