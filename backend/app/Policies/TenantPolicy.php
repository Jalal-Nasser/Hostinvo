<?php

namespace App\Policies;

use App\Models\Tenant;
use App\Models\User;

class TenantPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole(\App\Models\Role::SUPER_ADMIN);
    }

    public function create(User $user): bool
    {
        return $user->hasRole(\App\Models\Role::SUPER_ADMIN);
    }

    public function view(User $user, Tenant $tenant): bool
    {
        return $user->hasRole(\App\Models\Role::SUPER_ADMIN)
            || ($user->tenant_id === $tenant->id && $user->hasPermissionTo(['tenant.view', 'tenant.manage']));
    }

    public function update(User $user, Tenant $tenant): bool
    {
        return $user->hasRole(\App\Models\Role::SUPER_ADMIN)
            || ($user->tenant_id === $tenant->id && $user->hasPermissionTo('tenant.manage'));
    }

    public function activate(User $user, Tenant $tenant): bool
    {
        return $user->hasRole(\App\Models\Role::SUPER_ADMIN);
    }

    public function suspend(User $user, Tenant $tenant): bool
    {
        return $user->hasRole(\App\Models\Role::SUPER_ADMIN);
    }
}
