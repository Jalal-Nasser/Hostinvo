<?php

namespace App\Repositories\Provisioning;

use App\Contracts\Repositories\Provisioning\ProvisioningJobRepositoryInterface;
use App\Models\ProvisioningJob;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class EloquentProvisioningJobRepository implements ProvisioningJobRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);

        return ProvisioningJob::query()
            ->with(['service', 'server', 'requestedBy'])
            ->when(
                filled($filters['search'] ?? null),
                fn (Builder $query) => $query->where(function (Builder $builder) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $builder
                        ->where('operation', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%")
                        ->orWhereHas('service', function (Builder $serviceQuery) use ($search): void {
                            $serviceQuery
                                ->where('reference_number', 'like', "%{$search}%")
                                ->orWhere('domain', 'like', "%{$search}%")
                                ->orWhere('username', 'like', "%{$search}%");
                        })
                        ->orWhereHas('server', function (Builder $serverQuery) use ($search): void {
                            $serverQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('hostname', 'like', "%{$search}%");
                        });
                })
            )
            ->when(
                filled($filters['status'] ?? null),
                fn (Builder $query) => $query->where('status', $filters['status'])
            )
            ->when(
                filled($filters['operation'] ?? null),
                fn (Builder $query) => $query->where('operation', $filters['operation'])
            )
            ->when(
                filled($filters['service_id'] ?? null),
                fn (Builder $query) => $query->where('service_id', $filters['service_id'])
            )
            ->when(
                filled($filters['server_id'] ?? null),
                fn (Builder $query) => $query->where('server_id', $filters['server_id'])
            )
            ->latest('requested_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function findById(string $id): ?ProvisioningJob
    {
        return ProvisioningJob::query()->find($id);
    }

    public function findByIdForDisplay(string $id): ?ProvisioningJob
    {
        return ProvisioningJob::query()
            ->with([
                'service.client',
                'service.product',
                'server.group',
                'requestedBy',
                'logs',
            ])
            ->find($id);
    }

    public function create(array $attributes): ProvisioningJob
    {
        return ProvisioningJob::query()->create($attributes);
    }

    public function update(ProvisioningJob $job, array $attributes): ProvisioningJob
    {
        $job->fill($attributes);
        $job->save();

        return $job;
    }
}
