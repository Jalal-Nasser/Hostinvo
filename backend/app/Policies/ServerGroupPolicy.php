<?php

namespace App\Policies;

use App\Models\ServerGroup;
use App\Models\User;

class ServerGroupPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(['servers.view', 'servers.manage']);
    }

    public function view(User $user, ServerGroup $serverGroup): bool
    {
        return $user->tenant_id === $serverGroup->tenant_id
            && $user->hasPermissionTo(['servers.view', 'servers.manage']);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('servers.manage');
    }

    public function update(User $user, ServerGroup $serverGroup): bool
    {
        return $user->tenant_id === $serverGroup->tenant_id
            && $user->hasPermissionTo('servers.manage');
    }

    public function delete(User $user, ServerGroup $serverGroup): bool
    {
        return $user->tenant_id === $serverGroup->tenant_id
            && $user->hasPermissionTo('servers.manage');
    }
}
