<?php

namespace App\Repositories\Provisioning;

use App\Contracts\Repositories\Provisioning\ServiceRepositoryInterface;
use App\Models\Service;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class EloquentServiceRepository implements ServiceRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);

        return Service::query()
            ->with(['client', 'product', 'server'])
            ->withCount('provisioningJobs')
            ->when(
                filled($filters['search'] ?? null),
                fn (Builder $query) => $query->where(function (Builder $builder) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $builder
                        ->where('reference_number', 'like', "%{$search}%")
                        ->orWhere('domain', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhereHas('client', function (Builder $clientQuery) use ($search): void {
                            $clientQuery
                                ->where('company_name', 'like', "%{$search}%")
                                ->orWhere('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        })
                        ->orWhereHas('product', function (Builder $productQuery) use ($search): void {
                            $productQuery->where('name', 'like', "%{$search}%");
                        });
                })
            )
            ->when(
                filled($filters['status'] ?? null),
                fn (Builder $query) => $query->where('status', $filters['status'])
            )
            ->when(
                filled($filters['provisioning_state'] ?? null),
                fn (Builder $query) => $query->where('provisioning_state', $filters['provisioning_state'])
            )
            ->when(
                filled($filters['client_id'] ?? null),
                fn (Builder $query) => $query->where('client_id', $filters['client_id'])
            )
            ->when(
                filled($filters['product_id'] ?? null),
                fn (Builder $query) => $query->where('product_id', $filters['product_id'])
            )
            ->when(
                filled($filters['server_id'] ?? null),
                fn (Builder $query) => $query->where('server_id', $filters['server_id'])
            )
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function findById(string $id): ?Service
    {
        return Service::query()->find($id);
    }

    public function findByIdForDisplay(string $id): ?Service
    {
        return Service::query()
            ->with([
                'client',
                'product',
                'order',
                'owner',
                'server.group',
                'serverPackage.product',
                'credentials',
                'usage',
                'suspensions.user',
                'provisioningJobs.server',
                'provisioningJobs.requestedBy',
                'provisioningLogs.server',
            ])
            ->withCount('provisioningJobs')
            ->find($id);
    }

    public function create(array $attributes): Service
    {
        return Service::query()->create($attributes);
    }

    public function update(Service $service, array $attributes): Service
    {
        $service->fill($attributes);
        $service->save();

        return $service;
    }

    public function delete(Service $service): void
    {
        $service->delete();
    }
}
