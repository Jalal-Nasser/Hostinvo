<?php

namespace App\Repositories\Auth;

use App\Contracts\Repositories\Auth\TenantRepositoryInterface;
use App\Models\Tenant;

class EloquentTenantRepository implements TenantRepositoryInterface
{
    public function findById(string $id): ?Tenant
    {
        return Tenant::query()->find($id);
    }
}
