<?php

namespace App\Http\Resources\Portal;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PortalContentBlockResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $locale = str_starts_with((string) $request->get('locale', app()->getLocale()), 'ar') ? 'ar' : 'en';

        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'section' => $this->section,
            'key' => $this->key,
            'title_en' => $this->title_en,
            'title_ar' => $this->title_ar,
            'body_en' => $this->body_en,
            'body_ar' => $this->body_ar,
            'cta_label_en' => $this->cta_label_en,
            'cta_label_ar' => $this->cta_label_ar,
            'cta_href' => $this->cta_href,
            'status' => $this->status,
            'sort_order' => $this->sort_order,
            'localized_title' => $locale === 'ar' && filled($this->title_ar) ? $this->title_ar : $this->title_en,
            'localized_body' => $locale === 'ar' && filled($this->body_ar) ? $this->body_ar : $this->body_en,
            'localized_cta_label' => $locale === 'ar' && filled($this->cta_label_ar) ? $this->cta_label_ar : $this->cta_label_en,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
