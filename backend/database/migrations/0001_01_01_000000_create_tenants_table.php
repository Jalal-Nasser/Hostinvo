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
        Schema::create('tenants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('primary_domain')->nullable()->unique();
            $table->string('default_locale', 5)->default('en');
            $table->string('default_currency', 3)->default('USD');
            $table->string('timezone')->default('UTC');
            $table->string('status')->default('active');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'default_locale']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
