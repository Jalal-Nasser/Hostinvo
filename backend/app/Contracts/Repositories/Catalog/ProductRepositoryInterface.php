<?php

namespace App\Contracts\Repositories\Catalog;

use App\Models\Product;
use App\Models\ProductPricing;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ProductRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Product;

    public function findByIdForDisplay(string $id): ?Product;

    public function create(array $attributes): Product;

    public function update(Product $product, array $attributes): Product;

    public function syncPricing(Product $product, array $pricing): void;

    public function syncConfigurableOptions(Product $product, array $options): void;

    public function delete(Product $product): void;
}
