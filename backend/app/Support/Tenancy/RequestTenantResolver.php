<?php

namespace App\Support\Tenancy;

use App\Contracts\Repositories\Auth\TenantRepositoryInterface;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RequestTenantResolver
{
    public function __construct(
        private readonly TenantRepositoryInterface $tenants,
    ) {
    }

    public function resolveFromRequest(Request $request): ?Tenant
    {
        $hosts = array_filter([
            $request->headers->get('X-Tenant-Host'),
            parse_url((string) $request->headers->get('Origin'), PHP_URL_HOST),
            parse_url((string) $request->headers->get('Referer'), PHP_URL_HOST),
            $request->getHost(),
        ]);

        foreach ($hosts as $host) {
            $normalized = Str::lower(trim((string) $host));

            if ($normalized === '') {
                continue;
            }

            $tenant = $this->tenants->findByHost($normalized);

            if ($tenant) {
                return $tenant;
            }
        }

        return null;
    }
}
