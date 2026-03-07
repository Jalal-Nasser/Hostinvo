<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('users.view');
    }

    public function view(User $user, User $model): bool
    {
        return ($user->tenant_id === $model->tenant_id || $user->is($model))
            && $user->hasPermissionTo(['users.view', 'users.manage']);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('users.manage');
    }

    public function update(User $user, User $model): bool
    {
        return $user->tenant_id === $model->tenant_id
            && $user->hasPermissionTo('users.manage');
    }
}
