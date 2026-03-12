<?php

namespace App\Services\Catalog;

use App\Contracts\Repositories\Catalog\ProductGroupRepositoryInterface;
use App\Models\ProductGroup;
use App\Models\User;
use App\Support\Cache\TenantCache;
use App\Support\Tenancy\CurrentTenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductGroupService
{
    public function __construct(
        private readonly ProductGroupRepositoryInterface $groups,
        private readonly CurrentTenant $currentTenant,
        private readonly TenantCache $cache,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->groups->paginate($filters);
    }

    public function allForSelection(): Collection
    {
        $tenantId = $this->currentTenant->id();

        return $this->cache->remember(
            $tenantId,
            'catalog',
            'product-groups:selection',
            $this->selectionCacheTtl(),
            fn (): Collection => $this->groups->allForSelection()
        );
    }

    public function getForDisplay(ProductGroup $group): ProductGroup
    {
        return $this->groups->findByIdForDisplay($group->getKey()) ?? $group;
    }

    public function create(array $payload, User $actor): ProductGroup
    {
        $group = $this->groups->create($this->normalizeAttributes($payload, $actor));
        $this->flushSelectionCache($actor->tenant_id);

        return $group;
    }

    public function update(ProductGroup $group, array $payload, User $actor): ProductGroup
    {
        $updated = $this->groups->update($group, $this->normalizeAttributes($payload, $actor, $group));
        $this->flushSelectionCache($group->tenant_id);

        return $updated;
    }

    public function delete(ProductGroup $group): void
    {
        DB::transaction(function () use ($group): void {
            $this->groups->detachProducts($group);
            $this->groups->delete($group);
        });

        $this->flushSelectionCache($group->tenant_id);
    }

    private function normalizeAttributes(array $payload, User $actor, ?ProductGroup $group = null): array
    {
        $tenantId = $group?->tenant_id ?? $actor->tenant_id;

        if (blank($tenantId)) {
            throw ValidationException::withMessages([
                'tenant' => ['Tenant context is required for product-group management.'],
            ]);
        }

        $slug = filled($payload['slug'] ?? null)
            ? Str::slug((string) $payload['slug'])
            : Str::slug((string) $payload['name']);

        return array_merge(
            Arr::only($payload, [
                'name',
                'description',
                'status',
                'visibility',
                'display_order',
            ]),
            [
                'tenant_id' => $tenantId,
                'slug' => $slug,
            ]
        );
    }

    private function flushSelectionCache(?string $tenantId): void
    {
        $this->cache->forget($tenantId, 'catalog', 'product-groups:selection');
    }

    private function selectionCacheTtl(): int
    {
        return max(60, (int) config('hostinvo.performance.cache.catalog_selection_ttl_seconds', 300));
    }
}
