<?php

namespace App\Repositories\Billing;

use App\Contracts\Repositories\Billing\PaymentRepositoryInterface;
use App\Models\Payment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class EloquentPaymentRepository implements PaymentRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);

        return Payment::query()
            ->with(['client', 'invoice'])
            ->with('transactions')
            ->when(
                filled($filters['search'] ?? null),
                fn (Builder $query) => $query->where(function (Builder $builder) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $builder
                        ->where('reference', 'like', "%{$search}%")
                        ->orWhereHas('client', function (Builder $clientQuery) use ($search): void {
                            $clientQuery
                                ->where('company_name', 'like', "%{$search}%")
                                ->orWhere('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        })
                        ->orWhereHas('invoice', fn (Builder $invoiceQuery) => $invoiceQuery
                            ->where('reference_number', 'like', "%{$search}%"));
                })
            )
            ->when(
                filled($filters['invoice_id'] ?? null),
                fn (Builder $query) => $query->where('invoice_id', $filters['invoice_id'])
            )
            ->when(
                filled($filters['client_id'] ?? null),
                fn (Builder $query) => $query->where('client_id', $filters['client_id'])
            )
            ->when(
                filled($filters['type'] ?? null),
                fn (Builder $query) => $query->where('type', $filters['type'])
            )
            ->when(
                filled($filters['status'] ?? null),
                fn (Builder $query) => $query->where('status', $filters['status'])
            )
            ->latest('paid_at')
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $attributes): Payment
    {
        return Payment::query()->create($attributes);
    }
}
