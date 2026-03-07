<?php

namespace App\Policies;

use App\Models\Role;
use App\Models\User;

class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(['roles.view', 'roles.manage']);
    }

    public function view(User $user, Role $role): bool
    {
        return $user->hasPermissionTo(['roles.view', 'roles.manage']);
    }

    public function update(User $user, Role $role): bool
    {
        return $user->hasPermissionTo('roles.manage') && $role->name !== Role::SUPER_ADMIN;
    }
}
