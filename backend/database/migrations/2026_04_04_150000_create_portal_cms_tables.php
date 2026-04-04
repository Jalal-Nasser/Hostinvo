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
        Schema::create('announcements', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('slug', 160);
            $table->string('title_en', 255);
            $table->string('title_ar', 255)->nullable();
            $table->text('excerpt_en')->nullable();
            $table->text('excerpt_ar')->nullable();
            $table->longText('body_en');
            $table->longText('body_ar')->nullable();
            $table->string('status', 32)->default('draft');
            $table->boolean('is_featured')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestampTz('published_at')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->unique(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'status', 'is_featured', 'published_at', 'sort_order']);
        });

        Schema::create('knowledge_base_categories', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('slug', 160);
            $table->string('name_en', 255);
            $table->string('name_ar', 255)->nullable();
            $table->text('description_en')->nullable();
            $table->text('description_ar')->nullable();
            $table->string('status', 32)->default('active');
            $table->integer('sort_order')->default(0);
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->unique(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'status', 'sort_order']);
        });

        Schema::create('knowledge_base_articles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('category_id')->nullable()->constrained('knowledge_base_categories')->nullOnDelete();
            $table->string('slug', 160);
            $table->string('title_en', 255);
            $table->string('title_ar', 255)->nullable();
            $table->text('excerpt_en')->nullable();
            $table->text('excerpt_ar')->nullable();
            $table->longText('body_en');
            $table->longText('body_ar')->nullable();
            $table->string('status', 32)->default('draft');
            $table->boolean('is_featured')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestampTz('published_at')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->unique(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'category_id', 'status', 'published_at', 'sort_order']);
        });

        Schema::create('network_incidents', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('slug', 160);
            $table->string('title_en', 255);
            $table->string('title_ar', 255)->nullable();
            $table->text('summary_en')->nullable();
            $table->text('summary_ar')->nullable();
            $table->longText('details_en')->nullable();
            $table->longText('details_ar')->nullable();
            $table->string('status', 32)->default('open');
            $table->string('severity', 32)->default('info');
            $table->boolean('is_public')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestampTz('started_at')->nullable();
            $table->timestampTz('resolved_at')->nullable();
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->unique(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'status', 'severity', 'started_at', 'sort_order']);
        });

        Schema::create('portal_content_blocks', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('section', 100);
            $table->string('key', 120);
            $table->string('title_en', 255);
            $table->string('title_ar', 255)->nullable();
            $table->longText('body_en');
            $table->longText('body_ar')->nullable();
            $table->string('cta_label_en', 255)->nullable();
            $table->string('cta_label_ar', 255)->nullable();
            $table->string('cta_href', 500)->nullable();
            $table->string('status', 32)->default('draft');
            $table->integer('sort_order')->default(0);
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->unique(['tenant_id', 'key']);
            $table->index(['tenant_id', 'section', 'status', 'sort_order']);
        });

        Schema::create('portal_footer_links', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('group_key', 100)->default('support');
            $table->string('label_en', 255);
            $table->string('label_ar', 255)->nullable();
            $table->string('href', 500);
            $table->boolean('is_visible')->default(true);
            $table->boolean('open_in_new_tab')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestampsTz();

            $table->index(['tenant_id', 'group_key', 'is_visible', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('portal_footer_links');
        Schema::dropIfExists('portal_content_blocks');
        Schema::dropIfExists('network_incidents');
        Schema::dropIfExists('knowledge_base_articles');
        Schema::dropIfExists('knowledge_base_categories');
        Schema::dropIfExists('announcements');
    }
};
