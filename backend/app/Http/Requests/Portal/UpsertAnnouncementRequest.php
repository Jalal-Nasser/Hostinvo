<?php

namespace App\Http\Requests\Portal;

use App\Models\Announcement;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        $announcement = $this->route('announcement');

        return $announcement
            ? $this->user()->can('update', $announcement)
            : $this->user()->can('create', Announcement::class);
    }

    public function rules(): array
    {
        $announcementId = $this->route('announcement')?->id;
        $tenantId = $this->user()?->tenant_id;

        return [
            'slug' => [
                'nullable',
                'string',
                'max:160',
                'alpha_dash',
                Rule::unique('announcements', 'slug')->ignore($announcementId)->where(
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
                Announcement::STATUS_DRAFT,
                Announcement::STATUS_PUBLISHED,
                Announcement::STATUS_ARCHIVED,
            ])],
            'is_featured' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
