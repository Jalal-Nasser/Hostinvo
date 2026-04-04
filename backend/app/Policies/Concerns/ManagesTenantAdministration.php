<?php

namespace App\Policies\Concerns;

use App\Models\Role;
use App\Models\User;

trait ManagesTenantAdministration
{
    protected function canManageTenantAdministration(User $user): bool
    {
        return $user->hasRole([
            Role::SUPER_ADMIN,
            Role::TENANT_OWNER,
            Role::TENANT_ADMIN,
        ]) || $user->hasPermissionTo('tenant.manage');
    }

    protected function ownsTenantResource(User $user, object $resource): bool
    {
        return isset($resource->tenant_id) && $user->tenant_id === $resource->tenant_id;
    }
}
