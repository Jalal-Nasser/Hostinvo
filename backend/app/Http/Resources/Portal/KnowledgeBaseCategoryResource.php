<?php

namespace App\Http\Resources\Portal;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KnowledgeBaseCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $locale = str_starts_with((string) $request->get('locale', app()->getLocale()), 'ar') ? 'ar' : 'en';

        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'slug' => $this->slug,
            'name_en' => $this->name_en,
            'name_ar' => $this->name_ar,
            'description_en' => $this->description_en,
            'description_ar' => $this->description_ar,
            'status' => $this->status,
            'sort_order' => $this->sort_order,
            'articles_count' => $this->whenCounted('articles', $this->articles_count),
            'localized_name' => $locale === 'ar' && filled($this->name_ar) ? $this->name_ar : $this->name_en,
            'localized_description' => $locale === 'ar' && filled($this->description_ar) ? $this->description_ar : $this->description_en,
            'articles' => KnowledgeBaseArticleResource::collection($this->whenLoaded('articles')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
