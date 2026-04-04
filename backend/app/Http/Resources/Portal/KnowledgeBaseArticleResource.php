<?php

namespace App\Http\Resources\Portal;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KnowledgeBaseArticleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $locale = str_starts_with((string) $request->get('locale', app()->getLocale()), 'ar') ? 'ar' : 'en';

        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'category_id' => $this->category_id,
            'slug' => $this->slug,
            'title_en' => $this->title_en,
            'title_ar' => $this->title_ar,
            'excerpt_en' => $this->excerpt_en,
            'excerpt_ar' => $this->excerpt_ar,
            'body_en' => $this->body_en,
            'body_ar' => $this->body_ar,
            'status' => $this->status,
            'is_featured' => $this->is_featured,
            'sort_order' => $this->sort_order,
            'published_at' => $this->published_at?->toIso8601String(),
            'localized_title' => $locale === 'ar' && filled($this->title_ar) ? $this->title_ar : $this->title_en,
            'localized_excerpt' => $locale === 'ar' && filled($this->excerpt_ar) ? $this->excerpt_ar : $this->excerpt_en,
            'localized_body' => $locale === 'ar' && filled($this->body_ar) ? $this->body_ar : $this->body_en,
            'category' => new KnowledgeBaseCategoryResource($this->whenLoaded('category')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
