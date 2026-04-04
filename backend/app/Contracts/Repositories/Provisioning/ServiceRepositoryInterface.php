<?php

namespace App\Contracts\Repositories\Provisioning;

use App\Models\Service;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ServiceRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;

    public function paginateForPortal(User $user, array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Service;

    public function findByIdForDisplay(string $id): ?Service;

    public function findByIdForPortalDisplay(User $user, string $id): ?Service;

    public function create(array $attributes): Service;

    public function update(Service $service, array $attributes): Service;

    public function delete(Service $service): void;
}
