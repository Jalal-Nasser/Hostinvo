<?php

namespace App\Contracts\Repositories\Catalog;

use App\Models\ProductGroup;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface ProductGroupRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;

    public function allForSelection(): Collection;

    public function findById(string $id): ?ProductGroup;

    public function findByIdForDisplay(string $id): ?ProductGroup;

    public function create(array $attributes): ProductGroup;

    public function update(ProductGroup $group, array $attributes): ProductGroup;

    public function detachProducts(ProductGroup $group): void;

    public function delete(ProductGroup $group): void;
}
