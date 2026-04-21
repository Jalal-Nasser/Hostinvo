<?php

namespace App\Provisioning\Drivers\Generic;

use App\Models\Server;
use App\Provisioning\Contracts\ProvisioningDriverInterface;
use App\Provisioning\DTOs\ProvisionPayload;
use App\Provisioning\DTOs\ProvisionResult;
use App\Provisioning\DTOs\ServiceStatus;
use App\Provisioning\DTOs\UsageData;
use App\Provisioning\Exceptions\ProvisioningException;
use Illuminate\Support\Facades\Http;
use Throwable;

class GenericConnectionDriver implements ProvisioningDriverInterface
{
    private ?Server $server = null;

    public function withServer(Server $server): static
    {
        $this->server = $server;

        return $this;
    }

    public function code(): string
    {
        return $this->server?->panel_type ?? 'custom';
    }

    public function label(): string
    {
        return match ($this->code()) {
            Server::PANEL_DIRECTADMIN => 'DirectAdmin',
            default => 'Custom HTTP endpoint',
        };
    }

    public function testConnection(Server $server): array
    {
        $endpoint = trim((string) ($server->api_endpoint ?: $server->hostname));

        if ($endpoint === '') {
            throw new ProvisioningException('Server API endpoint is required.');
        }

        if (! preg_match('/^https?:\/\//i', $endpoint)) {
            $endpoint = 'https://'.$endpoint;
        }

        try {
            $response = Http::timeout(10)
                ->connectTimeout(5)
                ->withOptions(['verify' => $server->verify_ssl])
                ->get($endpoint);
        } catch (Throwable $exception) {
            throw new ProvisioningException(
                'Server connection failed: '.$exception->getMessage(),
                requestPayload: ['endpoint' => $endpoint],
            );
        }

        if (! $response->successful()) {
            throw new ProvisioningException(
                "Server responded with HTTP {$response->status()}.",
                requestPayload: ['endpoint' => $endpoint],
                responsePayload: ['status' => $response->status()],
            );
        }

        return [
            'driver' => $this->code(),
            'label' => $this->label(),
            'successful' => true,
            'message' => 'Server endpoint is reachable.',
            'metadata' => [
                'status' => $response->status(),
                'endpoint' => $endpoint,
            ],
        ];
    }

    public function createAccount(ProvisionPayload $payload): ProvisionResult
    {
        $this->unsupported();
    }

    public function suspendAccount(string $username, string $reason): bool
    {
        $this->unsupported();
    }

    public function unsuspendAccount(string $username): bool
    {
        $this->unsupported();
    }

    public function terminateAccount(string $username): bool
    {
        $this->unsupported();
    }

    public function changePackage(string $username, string $package): bool
    {
        $this->unsupported();
    }

    public function resetPassword(string $username, string $serviceId): bool
    {
        $this->unsupported();
    }

    public function syncUsage(string $username): UsageData
    {
        $this->unsupported();
    }

    public function syncServiceStatus(string $username): ServiceStatus
    {
        $this->unsupported();
    }

    private function unsupported(): never
    {
        throw new ProvisioningException(
            "Provisioning operations are not implemented for the {$this->label()} module."
        );
    }
}
