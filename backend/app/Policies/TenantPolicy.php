<?php

namespace App\Policies;

use App\Models\Tenant;
use App\Models\User;

class TenantPolicy
{
    public function view(User $user, Tenant $tenant): bool
    {
        return $user->tenant_id === $tenant->id && $user->hasPermissionTo(['tenant.view', 'tenant.manage']);
    }

    public function update(User $user, Tenant $tenant): bool
    {
        return $user->tenant_id === $tenant->id && $user->hasPermissionTo('tenant.manage');
    }
}
