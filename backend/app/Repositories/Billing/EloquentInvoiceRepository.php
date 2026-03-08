<?php

namespace App\Repositories\Billing;

use App\Contracts\Repositories\Billing\InvoiceRepositoryInterface;
use App\Models\Invoice;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;

class EloquentInvoiceRepository implements InvoiceRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);

        return Invoice::query()
            ->with(['client', 'order'])
            ->withCount(['items', 'payments'])
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
                        })
                        ->orWhereHas('order', fn (Builder $orderQuery) => $orderQuery
                            ->where('reference_number', 'like', "%{$search}%"));
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
            ->when(
                filled($filters['order_id'] ?? null),
                fn (Builder $query) => $query->where('order_id', $filters['order_id'])
            )
            ->latest('issue_date')
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function findById(string $id): ?Invoice
    {
        return Invoice::query()->find($id);
    }

    public function findByIdForDisplay(string $id): ?Invoice
    {
        return Invoice::query()
            ->with([
                'client',
                'order',
                'owner',
                'items' => fn ($query) => $query->orderBy('created_at'),
                'payments' => fn ($query) => $query->with('transactions')->latest('paid_at'),
                'transactions' => fn ($query) => $query->latest('occurred_at'),
            ])
            ->withCount(['items', 'payments'])
            ->find($id);
    }

    public function create(array $attributes): Invoice
    {
        return Invoice::query()->create($attributes);
    }

    public function update(Invoice $invoice, array $attributes): Invoice
    {
        $invoice->fill($attributes);
        $invoice->save();

        return $invoice;
    }

    public function syncItems(Invoice $invoice, array $items): void
    {
        $existing = $invoice->items()->get()->keyBy('id');
        $retainedIds = [];

        foreach ($items as $item) {
            $id = $item['id'] ?? null;
            $attributes = Arr::except($item, ['id']);
            $attributes['tenant_id'] = $invoice->tenant_id;

            if ($id && $existing->has($id)) {
                $existing->get($id)?->fill($attributes)->save();
                $retainedIds[] = $id;
                continue;
            }

            $created = $invoice->items()->create($attributes);
            $retainedIds[] = $created->getKey();
        }

        $deleteQuery = $invoice->items();

        if ($retainedIds !== []) {
            $deleteQuery->whereNotIn('id', $retainedIds)->delete();
            return;
        }

        $deleteQuery->delete();
    }

    public function delete(Invoice $invoice): void
    {
        $invoice->delete();
    }
}
