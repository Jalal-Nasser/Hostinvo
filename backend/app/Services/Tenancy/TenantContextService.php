<?php

namespace App\Services\Tenancy;

use App\Contracts\Repositories\Auth\TenantRepositoryInterface;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Session\Store;

class TenantContextService
{
    public const ACTIVE_TENANT_SESSION_KEY = 'platform_owner_active_tenant_id';

    public function __construct(
        private readonly TenantRepositoryInterface $tenants,
    ) {
    }

    public function resolveActiveTenant(Store $session): ?Tenant
    {
        $tenantId = $session->get(self::ACTIVE_TENANT_SESSION_KEY);

        if (! is_string($tenantId) || $tenantId === '') {
            return null;
        }

        return $this->tenants->findById($tenantId);
    }

    public function switchToTenant(User $user, Tenant $tenant, Store $session): Tenant
    {
        if (! $user->hasRole(Role::SUPER_ADMIN)) {
            throw new AuthorizationException('Only platform owners can switch tenant context.');
        }

        $session->put(self::ACTIVE_TENANT_SESSION_KEY, $tenant->getKey());
        $session->put('tenant_id', $tenant->getKey());

        return $tenant;
    }

    public function clear(User $user, Store $session): void
    {
        if (! $user->hasRole(Role::SUPER_ADMIN)) {
            throw new AuthorizationException('Only platform owners can clear tenant context.');
        }

        $session->forget(self::ACTIVE_TENANT_SESSION_KEY);

        if (blank($user->getOriginal('tenant_id'))) {
            $session->forget('tenant_id');
        } else {
            $session->put('tenant_id', $user->getOriginal('tenant_id'));
        }
    }

    public function applyToUser(User $user, Tenant $tenant): User
    {
        $user->setAttribute('tenant_id', $tenant->getKey());
        $user->setRelation('tenant', $tenant);

        return $user;
    }
}
