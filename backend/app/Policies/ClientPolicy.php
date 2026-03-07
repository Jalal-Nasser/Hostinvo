<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\User;

class ClientPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(['clients.view', 'clients.manage']);
    }

    public function view(User $user, Client $client): bool
    {
        return $user->tenant_id === $client->tenant_id
            && $user->hasPermissionTo(['clients.view', 'clients.manage']);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('clients.manage');
    }

    public function update(User $user, Client $client): bool
    {
        return $user->tenant_id === $client->tenant_id
            && $user->hasPermissionTo('clients.manage');
    }

    public function delete(User $user, Client $client): bool
    {
        return $user->tenant_id === $client->tenant_id
            && $user->hasPermissionTo('clients.manage');
    }
}
