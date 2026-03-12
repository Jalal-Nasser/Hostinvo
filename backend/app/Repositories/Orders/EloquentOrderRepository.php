<?php

namespace App\Repositories\Orders;

use App\Contracts\Repositories\Orders\OrderRepositoryInterface;
use App\Models\Order;
use App\Repositories\Concerns\ResolvesPagination;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;

class EloquentOrderRepository implements OrderRepositoryInterface
{
    use ResolvesPagination;

    public function paginate(array $filters): LengthAwarePaginator
    {
        $perPage = $this->resolvePerPage($filters);

        return Order::query()
            ->with(['client', 'owner'])
            ->withCount('items')
            ->when(
                filled($filters['search'] ?? null),
                fn (Builder $query) => $query->where(function (Builder $builder) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $builder
                        ->where('reference_number', 'like', "%{$search}%")
                        ->orWhereHas('client', function (Builder $clientQuery) use ($search): void {
                            $clientQuery
                                ->where('company_name', 'like', "%{$search}%")
                                ->orWhere('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                })
            )
            ->when(
                filled($filters['status'] ?? null),
                fn (Builder $query) => $query->where('status', $filters['status'])
            )
            ->when(
                filled($filters['client_id'] ?? null),
                fn (Builder $query) => $query->where('client_id', $filters['client_id'])
            )
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function findById(string $id): ?Order
    {
        return Order::query()->find($id);
    }

    public function findByIdForDisplay(string $id): ?Order
    {
        return Order::query()
            ->with([
                'client',
                'owner',
                'items' => fn ($query) => $query->with('product')->orderBy('created_at'),
            ])
            ->withCount('items')
            ->find($id);
    }

    public function create(array $attributes): Order
    {
        $order = new Order();
        $order->forceFill($attributes);
        $order->save();

        return $order;
    }

    public function update(Order $order, array $attributes): Order
    {
        $order->fill($attributes);
        $order->save();

        return $order;
    }

    public function syncItems(Order $order, array $items): void
    {
        $existing = $order->items()->get()->keyBy('id');
        $retainedIds = [];

        foreach ($items as $item) {
            $id = $item['id'] ?? null;
            $attributes = Arr::except($item, ['id']);
            $attributes['tenant_id'] = $order->tenant_id;

            if ($id && $existing->has($id)) {
                $existing->get($id)?->fill($attributes)->save();
                $retainedIds[] = $id;
                continue;
            }

            $created = $order->items()->create($attributes);
            $retainedIds[] = $created->getKey();
        }

        $deleteQuery = $order->items();

        if ($retainedIds !== []) {
            $deleteQuery->whereNotIn('id', $retainedIds)->delete();
            return;
        }

        $deleteQuery->delete();
    }

    public function delete(Order $order): void
    {
        $order->delete();
    }
}
