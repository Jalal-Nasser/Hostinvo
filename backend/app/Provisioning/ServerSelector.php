<?php

namespace App\Provisioning;

use App\Models\Server;
use App\Models\ServerPackage;
use App\Models\Service;
use Illuminate\Validation\ValidationException;

class ServerSelector
{
    public function pickServer(string $productId): Server
    {
        $server = Server::query()
            ->where('status', Server::STATUS_ACTIVE)
            ->where(function ($builder): void {
                $builder
                    ->whereNull('max_accounts')
                    ->orWhereColumn('account_count', '<', 'max_accounts');
            })
            ->whereHas('packages', fn ($query) => $query->where('product_id', $productId))
            ->orderBy('account_count')
            ->first();

        if (! $server instanceof Server) {
            throw ValidationException::withMessages([
                'server_id' => ['No available active server could be selected for the requested product.'],
            ]);
        }

        return $server;
    }

    public function resolveServerForService(Service $service): Server
    {
        if ($service->server) {
            $this->assertActiveServer($service->server);

            return $service->server;
        }

        if ($service->server_id) {
            $server = Server::query()->find($service->server_id);

            if ($server) {
                $this->assertActiveServer($server);

                return $server;
            }
        }

        $package = $this->resolvePackageForService($service);

        if (! $package?->server) {
            throw ValidationException::withMessages([
                'server_id' => ['No active server mapping is available for the selected service product.'],
            ]);
        }

        $this->assertActiveServer($package->server);

        return $package->server;
    }

    public function resolvePackageForService(Service $service): ?ServerPackage
    {
        if ($service->serverPackage) {
            return $service->serverPackage;
        }

        if ($service->server_package_id) {
            return ServerPackage::query()
                ->with('server')
                ->find($service->server_package_id);
        }

        if (! $service->product_id) {
            return null;
        }

        return ServerPackage::query()
            ->with('server')
            ->where('product_id', $service->product_id)
            ->whereHas('server', fn ($query) => $query->where('status', Server::STATUS_ACTIVE))
            ->orderByDesc('is_default')
            ->join('servers', 'servers.id', '=', 'server_packages.server_id')
            ->orderBy('servers.account_count')
            ->select('server_packages.*')
            ->first();
    }

    public function assertActiveServer(Server $server): void
    {
        if ($server->status !== Server::STATUS_ACTIVE) {
            throw ValidationException::withMessages([
                'server_id' => ['The selected server is not active for provisioning operations.'],
            ]);
        }
    }
}
