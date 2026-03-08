<?php

namespace App\Contracts\Repositories\Provisioning;

use App\Models\Server;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ServerRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Server;

    public function findByIdForDisplay(string $id): ?Server;

    public function create(array $attributes): Server;

    public function update(Server $server, array $attributes): Server;

    public function syncPackages(Server $server, array $packages): void;

    public function delete(Server $server): void;
}
