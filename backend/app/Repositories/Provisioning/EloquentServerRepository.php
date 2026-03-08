<?php

namespace App\Repositories\Provisioning;

use App\Contracts\Repositories\Provisioning\ServerRepositoryInterface;
use App\Models\Server;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;

class EloquentServerRepository implements ServerRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);

        return Server::query()
            ->with('group')
            ->withCount(['packages', 'services'])
            ->when(
                filled($filters['search'] ?? null),
                fn (Builder $query) => $query->where(function (Builder $builder) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $builder
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('hostname', 'like', "%{$search}%");
                })
            )
            ->when(
                filled($filters['status'] ?? null),
                fn (Builder $query) => $query->where('status', $filters['status'])
            )
            ->when(
                filled($filters['panel_type'] ?? null),
                fn (Builder $query) => $query->where('panel_type', $filters['panel_type'])
            )
            ->when(
                filled($filters['server_group_id'] ?? null),
                fn (Builder $query) => $query->where('server_group_id', $filters['server_group_id'])
            )
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function findById(string $id): ?Server
    {
        return Server::query()->find($id);
    }

    public function findByIdForDisplay(string $id): ?Server
    {
        return Server::query()
            ->with([
                'group',
                'packages.product',
                'services.client',
                'services.product',
                'provisioningJobs' => fn ($query) => $query->latest('requested_at')->limit(10),
                'provisioningJobs.service',
                'provisioningLogs' => fn ($query) => $query->latest('occurred_at')->limit(20),
                'provisioningLogs.service',
            ])
            ->withCount(['packages', 'services'])
            ->find($id);
    }

    public function create(array $attributes): Server
    {
        return Server::query()->create($attributes);
    }

    public function update(Server $server, array $attributes): Server
    {
        $server->fill($attributes);
        $server->save();

        return $server;
    }

    public function syncPackages(Server $server, array $packages): void
    {
        $existing = $server->packages()->get()->keyBy('id');
        $retainedIds = [];

        foreach ($packages as $package) {
            $id = $package['id'] ?? null;
            $attributes = Arr::except($package, ['id']);
            $attributes['tenant_id'] = $server->tenant_id;

            if ($id && $existing->has($id)) {
                $existing->get($id)?->fill($attributes)->save();
                $retainedIds[] = $id;
                continue;
            }

            $created = $server->packages()->create($attributes);
            $retainedIds[] = $created->getKey();
        }

        $deleteQuery = $server->packages();

        if ($retainedIds !== []) {
            $deleteQuery->whereNotIn('id', $retainedIds)->delete();

            return;
        }

        $deleteQuery->delete();
    }

    public function delete(Server $server): void
    {
        $server->delete();
    }
}
