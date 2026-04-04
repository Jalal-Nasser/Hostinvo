<?php

namespace App\Http\Requests\Tenancy;

use App\Models\TenantSetting;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePortalSurfaceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', TenantSetting::class);
    }

    public function rules(): array
    {
        return [
            'navigation' => ['required', 'array'],
            'navigation.*.key' => ['required', 'string', 'max:100'],
            'navigation.*.visible' => ['required', 'boolean'],
            'navigation.*.order' => ['required', 'integer', 'min:0'],
            'navigation.*.label_en' => ['nullable', 'string', 'max:255'],
            'navigation.*.label_ar' => ['nullable', 'string', 'max:255'],
            'home_sections' => ['required', 'array'],
            'home_sections.*.key' => ['required', 'string', 'max:100'],
            'home_sections.*.visible' => ['required', 'boolean'],
            'home_sections.*.order' => ['required', 'integer', 'min:0'],
            'home_sections.*.label_en' => ['nullable', 'string', 'max:255'],
            'home_sections.*.label_ar' => ['nullable', 'string', 'max:255'],
            'home_cards' => ['required', 'array'],
            'home_cards.*.key' => ['required', 'string', 'max:100'],
            'home_cards.*.visible' => ['required', 'boolean'],
            'home_cards.*.order' => ['required', 'integer', 'min:0'],
            'home_cards.*.label_en' => ['nullable', 'string', 'max:255'],
            'home_cards.*.label_ar' => ['nullable', 'string', 'max:255'],
            'content_sources' => ['required', 'array'],
            'content_sources.announcements' => ['required', 'boolean'],
            'content_sources.knowledgebase' => ['required', 'boolean'],
            'content_sources.network_status' => ['required', 'boolean'],
            'content_sources.website_security' => ['required', 'boolean'],
            'content_sources.footer_links' => ['required', 'boolean'],
        ];
    }
}
