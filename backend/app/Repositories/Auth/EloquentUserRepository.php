<?php

namespace App\Repositories\Auth;

use App\Contracts\Repositories\Auth\UserRepositoryInterface;
use App\Models\User;

class EloquentUserRepository implements UserRepositoryInterface
{
    public function findByEmail(string $email): ?User
    {
        return User::query()
            ->with(['tenant', 'roles.permissions'])
            ->where('email', $email)
            ->first();
    }

    public function findById(string $id): ?User
    {
        return User::query()
            ->with(['tenant', 'roles.permissions'])
            ->find($id);
    }

    public function save(User $user): bool
    {
        return $user->save();
    }
}
