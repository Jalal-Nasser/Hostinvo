<?php

namespace App\Http\Resources\Portal;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NetworkIncidentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $locale = str_starts_with((string) $request->get('locale', app()->getLocale()), 'ar') ? 'ar' : 'en';

        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'slug' => $this->slug,
            'title_en' => $this->title_en,
            'title_ar' => $this->title_ar,
            'summary_en' => $this->summary_en,
            'summary_ar' => $this->summary_ar,
            'details_en' => $this->details_en,
            'details_ar' => $this->details_ar,
            'status' => $this->status,
            'severity' => $this->severity,
            'is_public' => $this->is_public,
            'sort_order' => $this->sort_order,
            'started_at' => $this->started_at?->toIso8601String(),
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'localized_title' => $locale === 'ar' && filled($this->title_ar) ? $this->title_ar : $this->title_en,
            'localized_summary' => $locale === 'ar' && filled($this->summary_ar) ? $this->summary_ar : $this->summary_en,
            'localized_details' => $locale === 'ar' && filled($this->details_ar) ? $this->details_ar : $this->details_en,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
