<?php

namespace App\Services\Provisioning;

use App\Contracts\Repositories\Catalog\ProductRepositoryInterface;
use App\Contracts\Repositories\Provisioning\ServerGroupRepositoryInterface;
use App\Contracts\Repositories\Provisioning\ServerRepositoryInterface;
use App\Models\Server;
use App\Models\ServerGroup;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ServerManagementService
{
    public function __construct(
        private readonly ServerGroupRepositoryInterface $serverGroups,
        private readonly ServerRepositoryInterface $servers,
        private readonly ProductRepositoryInterface $products,
    ) {
    }

    public function paginateServerGroups(array $filters): LengthAwarePaginator
    {
        return $this->serverGroups->paginate($filters);
    }

    public function getServerGroupForDisplay(ServerGroup $serverGroup): ServerGroup
    {
        return $this->serverGroups->findByIdForDisplay($serverGroup->getKey()) ?? $serverGroup;
    }

    public function createServerGroup(array $payload, User $actor): ServerGroup
    {
        return $this->serverGroups->create([
            'tenant_id' => $actor->tenant_id,
            'name' => trim((string) $payload['name']),
            'selection_strategy' => $payload['selection_strategy'],
            'status' => $payload['status'],
            'notes' => $payload['notes'] ?? null,
        ]);
    }

    public function updateServerGroup(ServerGroup $serverGroup, array $payload): ServerGroup
    {
        return $this->serverGroups->update($serverGroup, [
            'name' => trim((string) $payload['name']),
            'selection_strategy' => $payload['selection_strategy'],
            'status' => $payload['status'],
            'notes' => $payload['notes'] ?? null,
        ]);
    }

    public function deleteServerGroup(ServerGroup $serverGroup): void
    {
        if ($serverGroup->servers()->exists()) {
            throw ValidationException::withMessages([
                'server_group' => ['Server groups with attached servers cannot be archived.'],
            ]);
        }

        $this->serverGroups->delete($serverGroup);
    }

    public function paginateServers(array $filters): LengthAwarePaginator
    {
        return $this->servers->paginate($filters);
    }

    public function getServerForDisplay(Server $server): Server
    {
        return $this->servers->findByIdForDisplay($server->getKey()) ?? $server;
    }

    public function createServer(array $payload, User $actor): Server
    {
        return DB::transaction(function () use ($payload, $actor): Server {
            $attributes = $this->buildServerAttributes($payload, $actor->tenant_id);
            $server = $this->servers->create($attributes);

            $this->servers->syncPackages($server, $this->buildPackagePayload($payload, $actor->tenant_id));

            return $this->getServerForDisplay($server);
        });
    }

    public function updateServer(Server $server, array $payload): Server
    {
        return DB::transaction(function () use ($server, $payload): Server {
            $attributes = $this->buildServerAttributes($payload, $server->tenant_id);
            $this->servers->update($server, $attributes);

            if (array_key_exists('packages', $payload)) {
                $this->servers->syncPackages($server, $this->buildPackagePayload($payload, $server->tenant_id));
            }

            return $this->getServerForDisplay($server);
        });
    }

    public function deleteServer(Server $server): void
    {
        if ($server->services()->exists()) {
            throw ValidationException::withMessages([
                'server' => ['Servers with linked services cannot be archived.'],
            ]);
        }

        $this->servers->delete($server);
    }

    public function syncServerPackages(Server $server, array $payload): Server
    {
        return DB::transaction(function () use ($server, $payload): Server {
            $this->servers->syncPackages($server, $this->buildPackagePayload($payload, $server->tenant_id));

            return $this->getServerForDisplay($server);
        });
    }

    private function buildServerAttributes(array $payload, string $tenantId): array
    {
        $serverGroupId = $payload['server_group_id'] ?? null;

        if ($serverGroupId) {
            $serverGroup = $this->serverGroups->findById($serverGroupId);

            if (! $serverGroup || $serverGroup->tenant_id !== $tenantId) {
                throw ValidationException::withMessages([
                    'server_group_id' => ['The selected server group is invalid for the current tenant.'],
                ]);
            }
        }

        return [
            'tenant_id' => $tenantId,
            'server_group_id' => $serverGroupId,
            'name' => trim((string) $payload['name']),
            'hostname' => trim((string) $payload['hostname']),
            'panel_type' => $payload['panel_type'],
            'api_endpoint' => $payload['api_endpoint'] ?? null,
            'api_port' => $payload['api_port'] ?? null,
            'status' => $payload['status'],
            'verify_ssl' => (bool) ($payload['verify_ssl'] ?? true),
            'max_accounts' => $payload['max_accounts'] ?? 0,
            'current_accounts' => $payload['current_accounts'] ?? 0,
            'username' => $payload['username'] ?? null,
            'credentials' => Arr::only($payload['credentials'] ?? [], ['api_token', 'api_key', 'api_secret', 'notes']),
            'last_tested_at' => $payload['last_tested_at'] ?? null,
            'notes' => $payload['notes'] ?? null,
        ];
    }

    private function buildPackagePayload(array $payload, string $tenantId): array
    {
        $packages = collect($payload['packages'] ?? [])->values();
        $productIds = $packages->pluck('product_id')->filter()->unique()->values();

        if ($productIds->isEmpty()) {
            return [];
        }

        $products = $productIds
            ->map(fn (string $productId) => $this->products->findById($productId))
            ->filter()
            ->keyBy('id');

        if ($products->count() !== $productIds->count()) {
            throw ValidationException::withMessages([
                'packages' => ['One or more selected products are invalid.'],
            ]);
        }

        foreach ($products as $product) {
            if ($product->tenant_id !== $tenantId) {
                throw ValidationException::withMessages([
                    'packages' => ['One or more selected products are invalid for the current tenant.'],
                ]);
            }
        }

        return $packages->map(function (array $package) use ($tenantId): array {
            return [
                'id' => $package['id'] ?? null,
                'tenant_id' => $tenantId,
                'product_id' => $package['product_id'],
                'panel_package_name' => trim((string) $package['panel_package_name']),
                'display_name' => $package['display_name'] ?? null,
                'is_default' => (bool) ($package['is_default'] ?? false),
                'metadata' => $package['metadata'] ?? null,
            ];
        })->all();
    }
}
