<?php

namespace App\Contracts\Repositories\Auth;

use App\Models\Tenant;
use Illuminate\Support\Collection;

interface TenantRepositoryInterface
{
    public function findById(string $id): ?Tenant;

    public function allActive(): Collection;
}
