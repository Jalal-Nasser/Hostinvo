<?php

namespace App\Repositories\Auth;

use App\Contracts\Repositories\Auth\TenantRepositoryInterface;
use App\Models\Tenant;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class EloquentTenantRepository implements TenantRepositoryInterface
{
    public function findById(string $id): ?Tenant
    {
        return Tenant::query()->find($id);
    }

    public function findBySlug(string $slug): ?Tenant
    {
        return Tenant::query()
            ->whereRaw('LOWER(slug) = ?', [Str::lower(trim($slug))])
            ->first();
    }

    public function findByPrimaryDomain(string $domain): ?Tenant
    {
        return Tenant::query()
            ->whereRaw('LOWER(primary_domain) = ?', [Str::lower(trim($domain))])
            ->first();
    }

    public function findByHost(string $host): ?Tenant
    {
        $normalized = Str::lower(trim(Str::before($host, ':'), '.'));

        if ($normalized === '') {
            return null;
        }

        return $this->findByPrimaryDomain($normalized)
            ?? $this->findBySlug(Str::before($normalized, '.'))
            ?? $this->findBySlug($normalized);
    }

    public function allActive(): Collection
    {
        return Tenant::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get();
    }
}
