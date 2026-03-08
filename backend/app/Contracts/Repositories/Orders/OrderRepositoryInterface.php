<?php

namespace App\Contracts\Repositories\Orders;

use App\Models\Order;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface OrderRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Order;

    public function findByIdForDisplay(string $id): ?Order;

    public function create(array $attributes): Order;

    public function update(Order $order, array $attributes): Order;

    public function syncItems(Order $order, array $items): void;

    public function delete(Order $order): void;
}
