<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('password')->nullable()->change();

            if (! Schema::hasColumn('users', 'requires_password_reset')) {
                $table->boolean('requires_password_reset')
                    ->default(false)
                    ->after('email_verification_required');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'requires_password_reset')) {
                $table->dropColumn('requires_password_reset');
            }

            $table->string('password')->nullable(false)->change();
        });
    }
};
