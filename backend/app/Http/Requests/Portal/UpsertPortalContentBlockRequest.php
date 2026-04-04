<?php

namespace App\Http\Requests\Portal;

use App\Models\PortalContentBlock;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertPortalContentBlockRequest extends FormRequest
{
    public function authorize(): bool
    {
        $block = $this->route('portalContentBlock');

        return $block
            ? $this->user()->can('update', $block)
            : $this->user()->can('create', PortalContentBlock::class);
    }

    public function rules(): array
    {
        $blockId = $this->route('portalContentBlock')?->id;
        $tenantId = $this->user()?->tenant_id;

        return [
            'section' => ['required', 'string', 'max:100'],
            'key' => [
                'required',
                'string',
                'max:120',
                'alpha_dash',
                Rule::unique('portal_content_blocks', 'key')->ignore($blockId)->where(
                    fn ($query) => $query->where('tenant_id', $tenantId)
                ),
            ],
            'title_en' => ['required', 'string', 'max:255'],
            'title_ar' => ['nullable', 'string', 'max:255'],
            'body_en' => ['required', 'string'],
            'body_ar' => ['nullable', 'string'],
            'cta_label_en' => ['nullable', 'string', 'max:255'],
            'cta_label_ar' => ['nullable', 'string', 'max:255'],
            'cta_href' => ['nullable', 'string', 'max:500'],
            'status' => ['required', Rule::in([
                PortalContentBlock::STATUS_DRAFT,
                PortalContentBlock::STATUS_PUBLISHED,
                PortalContentBlock::STATUS_ARCHIVED,
            ])],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
