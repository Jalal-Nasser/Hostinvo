<?php

namespace App\Repositories\Auth;

use App\Contracts\Repositories\Auth\TenantRepositoryInterface;
use App\Models\Tenant;
use Illuminate\Support\Collection;

class EloquentTenantRepository implements TenantRepositoryInterface
{
    public function findById(string $id): ?Tenant
    {
        return Tenant::query()->find($id);
    }

    public function allActive(): Collection
    {
        return Tenant::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get();
    }
}
