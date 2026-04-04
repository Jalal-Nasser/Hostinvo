<?php

namespace App\Services\Portal;

use App\Models\Announcement;
use App\Models\KnowledgeBaseArticle;
use App\Models\KnowledgeBaseCategory;
use App\Models\NetworkIncident;
use App\Models\PortalContentBlock;
use App\Models\PortalFooterLink;
use App\Models\Tenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PortalContentService
{
    public function paginateAnnouncements(array $filters = []): LengthAwarePaginator
    {
        return Announcement::query()
            ->when(filled($filters['search'] ?? null), function (Builder $query) use ($filters): void {
                $search = trim((string) $filters['search']);
                $query->where(function (Builder $builder) use ($search): void {
                    $builder
                        ->where('title_en', 'like', "%{$search}%")
                        ->orWhere('title_ar', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->when(filled($filters['status'] ?? null), fn (Builder $query): Builder => $query->where('status', $filters['status']))
            ->latest('published_at')
            ->latest('created_at')
            ->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function paginateKnowledgeBaseCategories(array $filters = []): LengthAwarePaginator
    {
        return KnowledgeBaseCategory::query()
            ->when(filled($filters['search'] ?? null), function (Builder $query) use ($filters): void {
                $search = trim((string) $filters['search']);
                $query->where(function (Builder $builder) use ($search): void {
                    $builder
                        ->where('name_en', 'like', "%{$search}%")
                        ->orWhere('name_ar', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->when(filled($filters['status'] ?? null), fn (Builder $query): Builder => $query->where('status', $filters['status']))
            ->withCount('articles')
            ->orderBy('sort_order')
            ->orderBy('name_en')
            ->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function paginateKnowledgeBaseArticles(array $filters = []): LengthAwarePaginator
    {
        return KnowledgeBaseArticle::query()
            ->with('category')
            ->when(filled($filters['search'] ?? null), function (Builder $query) use ($filters): void {
                $search = trim((string) $filters['search']);
                $query->where(function (Builder $builder) use ($search): void {
                    $builder
                        ->where('title_en', 'like', "%{$search}%")
                        ->orWhere('title_ar', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->when(filled($filters['status'] ?? null), fn (Builder $query): Builder => $query->where('status', $filters['status']))
            ->when(filled($filters['category_id'] ?? null), fn (Builder $query): Builder => $query->where('category_id', $filters['category_id']))
            ->latest('published_at')
            ->latest('created_at')
            ->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function paginateNetworkIncidents(array $filters = []): LengthAwarePaginator
    {
        return NetworkIncident::query()
            ->when(filled($filters['search'] ?? null), function (Builder $query) use ($filters): void {
                $search = trim((string) $filters['search']);
                $query->where(function (Builder $builder) use ($search): void {
                    $builder
                        ->where('title_en', 'like', "%{$search}%")
                        ->orWhere('title_ar', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->when(filled($filters['status'] ?? null), fn (Builder $query): Builder => $query->where('status', $filters['status']))
            ->when(filled($filters['severity'] ?? null), fn (Builder $query): Builder => $query->where('severity', $filters['severity']))
            ->latest('started_at')
            ->latest('created_at')
            ->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function paginateContentBlocks(array $filters = []): LengthAwarePaginator
    {
        return PortalContentBlock::query()
            ->when(filled($filters['search'] ?? null), function (Builder $query) use ($filters): void {
                $search = trim((string) $filters['search']);
                $query->where(function (Builder $builder) use ($search): void {
                    $builder
                        ->where('title_en', 'like', "%{$search}%")
                        ->orWhere('title_ar', 'like', "%{$search}%")
                        ->orWhere('key', 'like', "%{$search}%");
                });
            })
            ->when(filled($filters['status'] ?? null), fn (Builder $query): Builder => $query->where('status', $filters['status']))
            ->when(filled($filters['section'] ?? null), fn (Builder $query): Builder => $query->where('section', $filters['section']))
            ->orderBy('section')
            ->orderBy('sort_order')
            ->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function paginateFooterLinks(array $filters = []): LengthAwarePaginator
    {
        return PortalFooterLink::query()
            ->when(filled($filters['group_key'] ?? null), fn (Builder $query): Builder => $query->where('group_key', $filters['group_key']))
            ->orderBy('group_key')
            ->orderBy('sort_order')
            ->paginate((int) ($filters['per_page'] ?? 25));
    }

    public function saveAnnouncement(?Announcement $announcement, array $payload, Tenant $tenant): Announcement
    {
        $record = $announcement ?? new Announcement();
        $record->fill([
            'tenant_id' => $tenant->id,
            'slug' => $this->slug($payload['slug'] ?? null, $payload['title_en']),
            'title_en' => trim((string) $payload['title_en']),
            'title_ar' => $this->nullableString($payload['title_ar'] ?? null),
            'excerpt_en' => $this->nullableString($payload['excerpt_en'] ?? null),
            'excerpt_ar' => $this->nullableString($payload['excerpt_ar'] ?? null),
            'body_en' => trim((string) $payload['body_en']),
            'body_ar' => $this->nullableString($payload['body_ar'] ?? null),
            'status' => $payload['status'],
            'is_featured' => (bool) ($payload['is_featured'] ?? false),
            'sort_order' => (int) ($payload['sort_order'] ?? 0),
            'published_at' => $this->resolvePublishedAt($payload, $record->published_at),
        ]);
        $record->save();

        return $record->fresh();
    }

    public function saveKnowledgeBaseCategory(?KnowledgeBaseCategory $category, array $payload, Tenant $tenant): KnowledgeBaseCategory
    {
        $record = $category ?? new KnowledgeBaseCategory();
        $record->fill([
            'tenant_id' => $tenant->id,
            'slug' => $this->slug($payload['slug'] ?? null, $payload['name_en']),
            'name_en' => trim((string) $payload['name_en']),
            'name_ar' => $this->nullableString($payload['name_ar'] ?? null),
            'description_en' => $this->nullableString($payload['description_en'] ?? null),
            'description_ar' => $this->nullableString($payload['description_ar'] ?? null),
            'status' => $payload['status'],
            'sort_order' => (int) ($payload['sort_order'] ?? 0),
        ]);
        $record->save();

        return $record->fresh();
    }

    public function saveKnowledgeBaseArticle(?KnowledgeBaseArticle $article, array $payload, Tenant $tenant): KnowledgeBaseArticle
    {
        $record = $article ?? new KnowledgeBaseArticle();

        if (filled($payload['category_id'] ?? null)) {
            $category = KnowledgeBaseCategory::query()->find($payload['category_id']);

            if (! $category || $category->tenant_id !== $tenant->id) {
                throw ValidationException::withMessages([
                    'category_id' => ['The selected knowledgebase category is invalid for this tenant.'],
                ]);
            }
        }

        $record->fill([
            'tenant_id' => $tenant->id,
            'category_id' => $payload['category_id'] ?? null,
            'slug' => $this->slug($payload['slug'] ?? null, $payload['title_en']),
            'title_en' => trim((string) $payload['title_en']),
            'title_ar' => $this->nullableString($payload['title_ar'] ?? null),
            'excerpt_en' => $this->nullableString($payload['excerpt_en'] ?? null),
            'excerpt_ar' => $this->nullableString($payload['excerpt_ar'] ?? null),
            'body_en' => trim((string) $payload['body_en']),
            'body_ar' => $this->nullableString($payload['body_ar'] ?? null),
            'status' => $payload['status'],
            'is_featured' => (bool) ($payload['is_featured'] ?? false),
            'sort_order' => (int) ($payload['sort_order'] ?? 0),
            'published_at' => $this->resolvePublishedAt($payload, $record->published_at),
        ]);
        $record->save();

        return $record->fresh(['category']);
    }

    public function saveNetworkIncident(?NetworkIncident $incident, array $payload, Tenant $tenant): NetworkIncident
    {
        $record = $incident ?? new NetworkIncident();
        $record->fill([
            'tenant_id' => $tenant->id,
            'slug' => $this->slug($payload['slug'] ?? null, $payload['title_en']),
            'title_en' => trim((string) $payload['title_en']),
            'title_ar' => $this->nullableString($payload['title_ar'] ?? null),
            'summary_en' => $this->nullableString($payload['summary_en'] ?? null),
            'summary_ar' => $this->nullableString($payload['summary_ar'] ?? null),
            'details_en' => $this->nullableString($payload['details_en'] ?? null),
            'details_ar' => $this->nullableString($payload['details_ar'] ?? null),
            'status' => $payload['status'],
            'severity' => $payload['severity'],
            'is_public' => (bool) ($payload['is_public'] ?? true),
            'sort_order' => (int) ($payload['sort_order'] ?? 0),
            'started_at' => $payload['started_at'] ?? null,
            'resolved_at' => $payload['resolved_at'] ?? null,
        ]);
        $record->save();

        return $record->fresh();
    }

    public function saveContentBlock(?PortalContentBlock $block, array $payload, Tenant $tenant): PortalContentBlock
    {
        $record = $block ?? new PortalContentBlock();
        $record->fill([
            'tenant_id' => $tenant->id,
            'section' => trim((string) $payload['section']),
            'key' => trim((string) $payload['key']),
            'title_en' => trim((string) $payload['title_en']),
            'title_ar' => $this->nullableString($payload['title_ar'] ?? null),
            'body_en' => trim((string) $payload['body_en']),
            'body_ar' => $this->nullableString($payload['body_ar'] ?? null),
            'cta_label_en' => $this->nullableString($payload['cta_label_en'] ?? null),
            'cta_label_ar' => $this->nullableString($payload['cta_label_ar'] ?? null),
            'cta_href' => $this->nullableString($payload['cta_href'] ?? null),
            'status' => $payload['status'],
            'sort_order' => (int) ($payload['sort_order'] ?? 0),
        ]);
        $record->save();

        return $record->fresh();
    }

    public function saveFooterLink(?PortalFooterLink $link, array $payload, Tenant $tenant): PortalFooterLink
    {
        $record = $link ?? new PortalFooterLink();
        $record->fill([
            'tenant_id' => $tenant->id,
            'group_key' => trim((string) $payload['group_key']),
            'label_en' => trim((string) $payload['label_en']),
            'label_ar' => $this->nullableString($payload['label_ar'] ?? null),
            'href' => trim((string) $payload['href']),
            'is_visible' => (bool) ($payload['is_visible'] ?? true),
            'open_in_new_tab' => (bool) ($payload['open_in_new_tab'] ?? false),
            'sort_order' => (int) ($payload['sort_order'] ?? 0),
        ]);
        $record->save();

        return $record->fresh();
    }

    public function delete(Model $model): void
    {
        $model->delete();
    }

    public function publishedAnnouncements(Tenant $tenant, int $limit = 10): array
    {
        return Announcement::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', Announcement::STATUS_PUBLISHED)
            ->orderByDesc('is_featured')
            ->orderByDesc('published_at')
            ->limit($limit)
            ->get()
            ->all();
    }

    public function publishedKnowledgeBaseCategories(Tenant $tenant): array
    {
        return KnowledgeBaseCategory::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', KnowledgeBaseCategory::STATUS_ACTIVE)
            ->with(['articles' => function ($query): void {
                $query->where('status', KnowledgeBaseArticle::STATUS_PUBLISHED)
                    ->orderByDesc('is_featured')
                    ->orderBy('sort_order')
                    ->orderByDesc('published_at');
            }])
            ->orderBy('sort_order')
            ->get()
            ->all();
    }

    public function publicIncidents(Tenant $tenant): array
    {
        return NetworkIncident::query()
            ->where('tenant_id', $tenant->id)
            ->where('is_public', true)
            ->orderByRaw("case when status = 'open' then 0 when status = 'maintenance' then 1 when status = 'monitoring' then 2 else 3 end")
            ->orderByDesc('started_at')
            ->get()
            ->all();
    }

    public function publishedContentBlocks(Tenant $tenant, ?string $section = null): array
    {
        return PortalContentBlock::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', PortalContentBlock::STATUS_PUBLISHED)
            ->when(filled($section), fn (Builder $query): Builder => $query->where('section', $section))
            ->orderBy('sort_order')
            ->get()
            ->all();
    }

    public function visibleFooterLinks(Tenant $tenant): array
    {
        return PortalFooterLink::query()
            ->where('tenant_id', $tenant->id)
            ->where('is_visible', true)
            ->orderBy('group_key')
            ->orderBy('sort_order')
            ->get()
            ->all();
    }

    private function slug(?string $slug, string $fallback): string
    {
        $candidate = Str::slug((string) ($slug ?: $fallback));

        return $candidate !== '' ? $candidate : Str::random(12);
    }

    private function nullableString(mixed $value): ?string
    {
        $normalized = is_string($value) ? trim($value) : null;

        return filled($normalized) ? $normalized : null;
    }

    private function resolvePublishedAt(array $payload, mixed $currentValue): mixed
    {
        if (($payload['status'] ?? null) === Announcement::STATUS_PUBLISHED || ($payload['status'] ?? null) === KnowledgeBaseArticle::STATUS_PUBLISHED) {
            return $payload['published_at'] ?? $currentValue ?? now();
        }

        return $payload['published_at'] ?? null;
    }
}
