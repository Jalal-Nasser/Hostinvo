<?php

namespace App\Policies;

use App\Models\Server;
use App\Models\User;

class ServerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(['servers.view', 'servers.manage']);
    }

    public function view(User $user, Server $server): bool
    {
        return $user->tenant_id === $server->tenant_id
            && $user->hasPermissionTo(['servers.view', 'servers.manage']);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('servers.manage');
    }

    public function update(User $user, Server $server): bool
    {
        return $user->tenant_id === $server->tenant_id
            && $user->hasPermissionTo('servers.manage');
    }

    public function delete(User $user, Server $server): bool
    {
        return $user->tenant_id === $server->tenant_id
            && $user->hasPermissionTo('servers.manage');
    }

    public function testConnection(User $user, Server $server): bool
    {
        return $user->tenant_id === $server->tenant_id
            && $user->hasPermissionTo('servers.manage');
    }

    public function importExistingAccounts(User $user, Server $server): bool
    {
        return $user->tenant_id === $server->tenant_id
            && $user->hasPermissionTo(['servers.manage', 'services.manage']);
    }
}
