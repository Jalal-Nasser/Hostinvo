<?php

namespace App\Repositories\Catalog;

use App\Contracts\Repositories\Catalog\ProductGroupRepositoryInterface;
use App\Models\ProductGroup;
use App\Repositories\Concerns\ResolvesPagination;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class EloquentProductGroupRepository implements ProductGroupRepositoryInterface
{
    use ResolvesPagination;

    public function paginate(array $filters): LengthAwarePaginator
    {
        $perPage = $this->resolvePerPage($filters);

        return ProductGroup::query()
            ->withCount('products')
            ->when(
                filled($filters['search'] ?? null),
                fn (Builder $query) => $query->where(function (Builder $builder) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $builder
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                })
            )
            ->when(
                filled($filters['status'] ?? null),
                fn (Builder $query) => $query->where('status', $filters['status'])
            )
            ->when(
                filled($filters['visibility'] ?? null),
                fn (Builder $query) => $query->where('visibility', $filters['visibility'])
            )
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function allForSelection(): Collection
    {
        return ProductGroup::query()
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();
    }

    public function findById(string $id): ?ProductGroup
    {
        return ProductGroup::query()->find($id);
    }

    public function findByIdForDisplay(string $id): ?ProductGroup
    {
        return ProductGroup::query()
            ->withCount('products')
            ->find($id);
    }

    public function create(array $attributes): ProductGroup
    {
        return ProductGroup::query()->create($attributes);
    }

    public function update(ProductGroup $group, array $attributes): ProductGroup
    {
        $group->fill($attributes);
        $group->save();

        return $group;
    }

    public function detachProducts(ProductGroup $group): void
    {
        $group->products()->update([
            'product_group_id' => null,
        ]);
    }

    public function delete(ProductGroup $group): void
    {
        $group->delete();
    }
}
