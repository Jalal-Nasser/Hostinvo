<?php

namespace App\Services\Catalog;

use App\Contracts\Repositories\Catalog\ProductGroupRepositoryInterface;
use App\Models\ProductGroup;
use App\Models\User;
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
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->groups->paginate($filters);
    }

    public function allForSelection(): Collection
    {
        return $this->groups->allForSelection();
    }

    public function getForDisplay(ProductGroup $group): ProductGroup
    {
        return $this->groups->findByIdForDisplay($group->getKey()) ?? $group;
    }

    public function create(array $payload, User $actor): ProductGroup
    {
        return $this->groups->create($this->normalizeAttributes($payload, $actor));
    }

    public function update(ProductGroup $group, array $payload, User $actor): ProductGroup
    {
        return $this->groups->update($group, $this->normalizeAttributes($payload, $actor, $group));
    }

    public function delete(ProductGroup $group): void
    {
        DB::transaction(function () use ($group): void {
            $this->groups->detachProducts($group);
            $this->groups->delete($group);
        });
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
}
