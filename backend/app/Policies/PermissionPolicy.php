<?php

namespace App\Policies;

use App\Models\Permission;
use App\Models\User;

class PermissionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(['roles.view', 'roles.manage']);
    }

    public function view(User $user, Permission $permission): bool
    {
        return $this->viewAny($user)
            && ($permission->tenant_id === null || $permission->tenant_id === $user->tenant_id);
    }

    public function create(User $user): bool
    {
        return filled($user->tenant_id) && $user->hasPermissionTo('roles.manage');
    }

    public function update(User $user, Permission $permission): bool
    {
        return $user->hasPermissionTo('roles.manage')
            && $permission->tenant_id !== null
            && $permission->tenant_id === $user->tenant_id;
    }

    public function delete(User $user, Permission $permission): bool
    {
        return $this->update($user, $permission);
    }
}
