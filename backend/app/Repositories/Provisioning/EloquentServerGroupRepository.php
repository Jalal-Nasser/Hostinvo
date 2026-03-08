<?php

namespace App\Repositories\Provisioning;

use App\Contracts\Repositories\Provisioning\ServerGroupRepositoryInterface;
use App\Models\ServerGroup;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class EloquentServerGroupRepository implements ServerGroupRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);

        return ServerGroup::query()
            ->withCount('servers')
            ->when(
                filled($filters['search'] ?? null),
                fn (Builder $query) => $query->where('name', 'like', '%' . trim((string) $filters['search']) . '%')
            )
            ->when(
                filled($filters['status'] ?? null),
                fn (Builder $query) => $query->where('status', $filters['status'])
            )
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function findById(string $id): ?ServerGroup
    {
        return ServerGroup::query()->find($id);
    }

    public function findByIdForDisplay(string $id): ?ServerGroup
    {
        return ServerGroup::query()
            ->with([
                'servers' => fn (Builder $query) => $query->withCount(['packages', 'services'])->orderBy('name'),
            ])
            ->find($id);
    }

    public function create(array $attributes): ServerGroup
    {
        return ServerGroup::query()->create($attributes);
    }

    public function update(ServerGroup $serverGroup, array $attributes): ServerGroup
    {
        $serverGroup->fill($attributes);
        $serverGroup->save();

        return $serverGroup;
    }

    public function delete(ServerGroup $serverGroup): void
    {
        $serverGroup->delete();
    }
}
