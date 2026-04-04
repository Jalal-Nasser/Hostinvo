<?php

namespace App\Http\Resources\Portal;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PortalFooterLinkResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $locale = str_starts_with((string) $request->get('locale', app()->getLocale()), 'ar') ? 'ar' : 'en';

        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'group_key' => $this->group_key,
            'label_en' => $this->label_en,
            'label_ar' => $this->label_ar,
            'href' => $this->href,
            'is_visible' => $this->is_visible,
            'open_in_new_tab' => $this->open_in_new_tab,
            'sort_order' => $this->sort_order,
            'localized_label' => $locale === 'ar' && filled($this->label_ar) ? $this->label_ar : $this->label_en,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
