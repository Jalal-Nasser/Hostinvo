<?php

namespace App\Contracts\Repositories\Billing;

use App\Models\Payment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface PaymentRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;

    public function create(array $attributes): Payment;
}
