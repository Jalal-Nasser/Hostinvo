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
        Schema::create('ticket_departments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'slug']);
        });

        Schema::create('ticket_statuses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code');
            $table->string('color', 24)->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_closed')->default(false);
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'code']);
        });

        Schema::create('tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('department_id')->nullable()->constrained('ticket_departments')->nullOnDelete();
            $table->foreignUuid('status_id')->nullable()->constrained('ticket_statuses')->nullOnDelete();
            $table->foreignUuid('client_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('client_contact_id')->nullable()->constrained('client_contacts')->nullOnDelete();
            $table->foreignUuid('opened_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('assigned_to_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ticket_number');
            $table->string('subject');
            $table->string('priority', 32);
            $table->string('source', 32)->default('portal');
            $table->string('last_reply_by', 32)->nullable();
            $table->timestamp('last_reply_at')->nullable();
            $table->timestamp('last_client_reply_at')->nullable();
            $table->timestamp('last_admin_reply_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'ticket_number']);
            $table->index(['tenant_id', 'priority']);
            $table->index(['tenant_id', 'department_id']);
            $table->index(['tenant_id', 'status_id']);
            $table->index(['tenant_id', 'assigned_to_user_id']);
        });

        Schema::create('ticket_replies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('client_contact_id')->nullable()->constrained('client_contacts')->nullOnDelete();
            $table->string('reply_type', 32);
            $table->boolean('is_internal')->default(false);
            $table->longText('message');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'ticket_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_replies');
        Schema::dropIfExists('tickets');
        Schema::dropIfExists('ticket_statuses');
        Schema::dropIfExists('ticket_departments');
    }
};
