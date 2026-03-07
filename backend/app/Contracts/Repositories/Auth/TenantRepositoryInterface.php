<?php

namespace App\Contracts\Repositories\Auth;

use App\Models\Tenant;

interface TenantRepositoryInterface
{
    public function findById(string $id): ?Tenant;
}
