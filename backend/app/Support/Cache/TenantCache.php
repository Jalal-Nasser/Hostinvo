<?php

namespace App\Support\Cache;

use App\Support\Tenancy\CurrentTenant;
use Closure;
use DateInterval;
use DateTimeInterface;
use Illuminate\Support\Facades\Cache;

class TenantCache
{
    public function __construct(
        private readonly CurrentTenant $currentTenant,
    ) {
    }

    public function remember(
        ?string $tenantId,
        string $namespace,
        string $key,
        DateTimeInterface|DateInterval|int|null $ttl,
        Closure $callback,
    ): mixed {
        $resolvedTenantId = $this->resolveTenantId($tenantId);

        if (blank($resolvedTenantId)) {
            return $callback();
        }

        return Cache::remember(
            $this->buildKey($resolvedTenantId, $namespace, $key),
            $ttl,
            $callback,
        );
    }

    public function forget(?string $tenantId, string $namespace, string $key): void
    {
        $resolvedTenantId = $this->resolveTenantId($tenantId);

        if (blank($resolvedTenantId)) {
            return;
        }

        Cache::forget($this->buildKey($resolvedTenantId, $namespace, $key));
    }

    private function resolveTenantId(?string $tenantId): ?string
    {
        if (filled($tenantId)) {
            return (string) $tenantId;
        }

        $currentTenantId = $this->currentTenant->id();

        return filled($currentTenantId) ? (string) $currentTenantId : null;
    }

    private function buildKey(string $tenantId, string $namespace, string $key): string
    {
        return sprintf(
            'tenant:%s:%s:%s',
            $tenantId,
            trim($namespace),
            trim($key),
        );
    }
}
