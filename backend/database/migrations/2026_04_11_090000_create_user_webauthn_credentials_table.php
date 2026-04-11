<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_webauthn_credentials', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mfa_method_id')->constrained('user_mfa_methods')->cascadeOnDelete();
            $table->string('credential_id')->unique();
            $table->text('public_key');
            $table->unsignedBigInteger('sign_count')->default(0);
            $table->string('aaguid', 64)->nullable();
            $table->jsonb('transports')->nullable();
            $table->timestampTz('last_used_at')->nullable();
            $table->timestampsTz();

            $table->index(['user_id', 'mfa_method_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_webauthn_credentials');
    }
};
