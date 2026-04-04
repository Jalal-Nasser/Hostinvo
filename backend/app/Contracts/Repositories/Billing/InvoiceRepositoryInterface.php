<?php

namespace App\Contracts\Repositories\Billing;

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface InvoiceRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;

    public function paginateForPortal(User $user, array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Invoice;

    public function findByIdForDisplay(string $id): ?Invoice;

    public function findByIdForPortalDisplay(User $user, string $id): ?Invoice;

    public function create(array $attributes): Invoice;

    public function update(Invoice $invoice, array $attributes): Invoice;

    public function syncItems(Invoice $invoice, array $items): void;

    public function delete(Invoice $invoice): void;
}
