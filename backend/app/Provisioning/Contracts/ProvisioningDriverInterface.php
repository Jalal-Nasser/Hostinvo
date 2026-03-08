<?php

namespace App\Provisioning\Contracts;

use App\Models\Server;
use App\Provisioning\DTOs\ProvisionPayload;
use App\Provisioning\DTOs\ProvisionResult;
use App\Provisioning\DTOs\ServiceStatus;
use App\Provisioning\DTOs\UsageData;

interface ProvisioningDriverInterface
{
    public function code(): string;

    public function label(): string;

    public function testConnection(Server $server): array;

    public function createAccount(ProvisionPayload $payload): ProvisionResult;

    public function suspendAccount(string $username, string $reason): bool;

    public function unsuspendAccount(string $username): bool;

    public function terminateAccount(string $username): bool;

    public function changePackage(string $username, string $package): bool;

    public function resetPassword(string $username, string $newPassword): bool;

    public function syncUsage(string $username): UsageData;

    public function syncServiceStatus(string $username): ServiceStatus;
}
