<?php

namespace App\Contracts\Repositories\Provisioning;

use App\Models\ServerGroup;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ServerGroupRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?ServerGroup;

    public function findByIdForDisplay(string $id): ?ServerGroup;

    public function create(array $attributes): ServerGroup;

    public function update(ServerGroup $serverGroup, array $attributes): ServerGroup;

    public function delete(ServerGroup $serverGroup): void;
}
