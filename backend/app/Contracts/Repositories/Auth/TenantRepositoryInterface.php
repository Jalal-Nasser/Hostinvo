<?php

namespace App\Contracts\Repositories\Auth;

use App\Models\Tenant;
use Illuminate\Support\Collection;

interface TenantRepositoryInterface
{
    public function findById(string $id): ?Tenant;

    public function findBySlug(string $slug): ?Tenant;

    public function findByPrimaryDomain(string $domain): ?Tenant;

    public function findByHost(string $host): ?Tenant;

    public function allActive(): Collection;
}
