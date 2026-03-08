<?php

namespace App\Provisioning;

use App\Models\Server;
use App\Provisioning\Contracts\ProvisioningDriverInterface;
use Illuminate\Contracts\Container\Container;
use InvalidArgumentException;

class ProvisioningDriverManager
{
    public function __construct(private readonly Container $container)
    {
    }

    public function forServer(Server $server): ProvisioningDriverInterface
    {
        $drivers = config('provisioning.drivers', []);
        $driverClass = $drivers[$server->panel_type] ?? null;

        if (! is_string($driverClass) || $driverClass === '') {
            throw new InvalidArgumentException("No provisioning driver is configured for panel [{$server->panel_type}].");
        }

        $driver = $this->container->make($driverClass);

        if (! $driver instanceof ProvisioningDriverInterface) {
            throw new InvalidArgumentException("Configured provisioning driver [{$driverClass}] is invalid.");
        }

        if (method_exists($driver, 'withServer')) {
            $driver->withServer($server);
        }

        return $driver;
    }
}
