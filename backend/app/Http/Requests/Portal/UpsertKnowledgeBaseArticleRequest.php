<?php

namespace App\Http\Requests\Portal;

use App\Models\KnowledgeBaseArticle;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertKnowledgeBaseArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $article = $this->route('knowledgebaseArticle');

        return $article
            ? $this->user()->can('update', $article)
            : $this->user()->can('create', KnowledgeBaseArticle::class);
    }

    public function rules(): array
    {
        $articleId = $this->route('knowledgebaseArticle')?->id;
        $tenantId = $this->user()?->tenant_id;

        return [
            'category_id' => [
                'nullable',
                'uuid',
                Rule::exists('knowledge_base_categories', 'id')->where(
                    fn ($query) => $query->where('tenant_id', $tenantId)
                ),
            ],
            'slug' => [
                'nullable',
                'string',
                'max:160',
                'alpha_dash',
                Rule::unique('knowledge_base_articles', 'slug')->ignore($articleId)->where(
                    fn ($query) => $query->where('tenant_id', $tenantId)
                ),
            ],
            'title_en' => ['required', 'string', 'max:255'],
            'title_ar' => ['nullable', 'string', 'max:255'],
            'excerpt_en' => ['nullable', 'string'],
            'excerpt_ar' => ['nullable', 'string'],
            'body_en' => ['required', 'string'],
            'body_ar' => ['nullable', 'string'],
            'status' => ['required', Rule::in([
                KnowledgeBaseArticle::STATUS_DRAFT,
                KnowledgeBaseArticle::STATUS_PUBLISHED,
                KnowledgeBaseArticle::STATUS_ARCHIVED,
            ])],
            'is_featured' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
