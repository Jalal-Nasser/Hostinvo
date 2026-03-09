<?php

namespace App\Contracts\Repositories\Auth;

use App\Models\User;

interface UserRepositoryInterface
{
    public function findByEmail(string $email): ?User;

    public function findByEmailForTenant(string $email, string $tenantId): ?User;

    public function findById(string $id): ?User;

    public function save(User $user): bool;
}
