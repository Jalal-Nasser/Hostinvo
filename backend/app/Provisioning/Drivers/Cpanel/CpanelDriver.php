<?php

namespace App\Provisioning\Drivers\Cpanel;

use App\Models\Server;
use App\Models\Service;
use App\Models\ServiceCredential;
use App\Provisioning\Contracts\ProvisioningDriverInterface;
use App\Provisioning\DTOs\ProvisionPayload;
use App\Provisioning\DTOs\ProvisionResult;
use App\Provisioning\DTOs\ServiceStatus;
use App\Provisioning\DTOs\UsageData;
use App\Provisioning\Exceptions\ProvisioningException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CpanelDriver implements ProvisioningDriverInterface
{
    private ?Server $server = null;

    private array $lastRequestPayload = [];

    private array $lastResponsePayload = [];

    public function __construct(private readonly CpanelApiClient $client) {}

    public function withServer(Server $server): static
    {
        $this->server = $server;
        $this->logInsecureSslUsage($server);

        return $this;
    }

    public function consumeTelemetry(): array
    {
        $telemetry = [
            'request' => $this->lastRequestPayload,
            'response' => $this->lastResponsePayload,
        ];

        $this->lastRequestPayload = [];
        $this->lastResponsePayload = [];

        return $telemetry;
    }

    public function code(): string
    {
        return 'cpanel';
    }

    public function label(): string
    {
        return 'cPanel / WHM';
    }

    public function testConnection(Server $server): array
    {
        $this->logInsecureSslUsage($server);

        return $this->client->testConnection($server);
    }

    public function createAccount(ProvisionPayload $payload): ProvisionResult
    {
        $requestPayload = [
            'username' => $this->normalizeUsername($payload->username),
            'domain' => trim($payload->domain),
            'plan' => trim($payload->packageName),
            'contactemail' => $payload->contactEmail ?: $payload->email,
        ];

        $response = $this->client->createAccount($this->server(), array_merge($requestPayload, [
            'password' => $this->resolveServicePassword($payload->serviceId),
        ]));

        $responsePayload = $this->summarizeResponse($response, $requestPayload['username'], $requestPayload['plan']);
        $this->rememberTelemetry($payload->sanitized(), $responsePayload);

        return new ProvisionResult(
            success: true,
            username: $requestPayload['username'],
            ip: Arr::get($responsePayload, 'data.ip'),
            nameserver1: Arr::get($responsePayload, 'data.nameserver'),
            nameserver2: Arr::get($responsePayload, 'data.nameserver2'),
            rawResponse: json_encode($responsePayload) ?: null,
        );
    }

    public function suspendAccount(string $username, string $reason): bool
    {
        $requestPayload = [
            'user' => $this->normalizeUsername($username),
            'reason' => trim($reason) !== '' ? trim($reason) : 'Suspended by Hostinvo.',
        ];

        $response = $this->client->suspendAccount($this->server(), $requestPayload);
        $this->rememberTelemetry($requestPayload, $this->summarizeResponse($response, $requestPayload['user']));

        return true;
    }

    public function unsuspendAccount(string $username): bool
    {
        $requestPayload = [
            'user' => $this->normalizeUsername($username),
        ];

        $response = $this->client->unsuspendAccount($this->server(), $requestPayload);
        $this->rememberTelemetry($requestPayload, $this->summarizeResponse($response, $requestPayload['user']));

        return true;
    }

    public function terminateAccount(string $username): bool
    {
        $requestPayload = [
            'user' => $this->normalizeUsername($username),
            'keepdns' => 0,
        ];

        $response = $this->client->terminateAccount($this->server(), $requestPayload);
        $this->rememberTelemetry($requestPayload, $this->summarizeResponse($response, $requestPayload['user']));

        return true;
    }

    public function changePackage(string $username, string $package): bool
    {
        $requestPayload = [
            'user' => $this->normalizeUsername($username),
            'pkg' => trim($package),
        ];

        $response = $this->client->changePackage($this->server(), $requestPayload);
        $this->rememberTelemetry($requestPayload, $this->summarizeResponse($response, $requestPayload['user'], $requestPayload['pkg']));

        return true;
    }

    public function resetPassword(string $username, string $serviceId): bool
    {
        $requestPayload = [
            'user' => $this->normalizeUsername($username),
        ];

        $response = $this->client->resetPassword($this->server(), array_merge($requestPayload, [
            'pass' => $this->resolveServicePassword($serviceId),
        ]));

        $this->rememberTelemetry($requestPayload, $this->summarizeResponse($response, $requestPayload['user']));

        return true;
    }

    public function syncUsage(string $username): UsageData
    {
        $normalized = $this->normalizeUsername($username);
        $account = $this->client->findAccount($this->server(), $normalized);

        if (! $account) {
            throw new ProvisioningException(
                __('provisioning.cpanel.account_missing'),
                requestPayload: ['username' => $normalized],
            );
        }

        $bandwidth = $this->client->fetchBandwidth($this->server(), $normalized);
        $responsePayload = [
            'account' => Arr::only($account, ['user', 'domain', 'plan', 'diskused', 'disklimit', 'suspended', 'suspendreason']),
            'bandwidth' => Arr::only($bandwidth, ['totalbytes', 'bwlimit']),
        ];

        $this->rememberTelemetry(['username' => $normalized], $responsePayload);

        return new UsageData(
            diskUsedMb: $this->toMegabytes(Arr::get($account, 'diskused')),
            diskLimitMb: $this->toMegabytes(Arr::get($account, 'disklimit')),
            bandwidthUsedMb: $this->toMegabytes(Arr::get($bandwidth, 'totalbytes') ?? Arr::get($bandwidth, 'total'), true),
            bandwidthLimitMb: $this->toMegabytes(Arr::get($bandwidth, 'bwlimit') ?? Arr::get($account, 'maxbw'), true),
            inodesUsed: 0,
            emailAccountsUsed: 0,
            databasesUsed: 0,
            serviceStatus: $this->determineServiceStatus($account),
            suspendReason: Arr::get($account, 'suspendreason'),
            packageName: Arr::get($account, 'plan'),
            rawResponse: json_encode($responsePayload) ?: null,
        );
    }

    public function syncServiceStatus(string $username): ServiceStatus
    {
        $normalized = $this->normalizeUsername($username);
        $account = $this->client->findAccount($this->server(), $normalized);

        if (! $account) {
            throw new ProvisioningException(
                __('provisioning.cpanel.account_missing'),
                requestPayload: ['username' => $normalized],
            );
        }

        $responsePayload = [
            'account' => Arr::only($account, ['user', 'domain', 'plan', 'suspended', 'suspendreason']),
        ];

        $this->rememberTelemetry(['username' => $normalized], $responsePayload);

        return new ServiceStatus(
            status: $this->determineServiceStatus($account),
            suspendReason: Arr::get($account, 'suspendreason'),
            packageName: Arr::get($account, 'plan'),
            rawResponse: json_encode($responsePayload) ?: null,
        );
    }

    private function rememberTelemetry(array $requestPayload, array $responsePayload): void
    {
        $this->lastRequestPayload = $requestPayload;
        $this->lastResponsePayload = $responsePayload;
    }

    private function resolveServicePassword(string $serviceId): string
    {
        $credential = ServiceCredential::query()
            ->where('service_id', $serviceId)
            ->first();

        $password = $credential?->decryptValue();

        if ($password === null || $password === '') {
            throw new ProvisioningException(
                'Provisioning password credentials are missing for this service.',
                requestPayload: ['service_id' => $serviceId],
            );
        }

        return $password;
    }

    private function server(): Server
    {
        if (! $this->server instanceof Server) {
            throw new ProvisioningException('Provisioning driver is missing a bound server instance.');
        }

        return $this->server;
    }

    private function normalizeUsername(string $value): string
    {
        $normalized = strtolower(preg_replace('/[^a-z0-9]/', '', $value) ?? '');

        if ($normalized === '') {
            $normalized = 'host'.strtolower(Str::random(8));
        }

        if (is_numeric($normalized[0])) {
            $normalized = 'h'.$normalized;
        }

        $normalized = substr($normalized, 0, 16);

        if (strlen($normalized) < 5) {
            $normalized .= substr(strtolower(Str::random(5)), 0, 5 - strlen($normalized));
        }

        return $normalized;
    }

    private function determineServiceStatus(array $account): string
    {
        return filter_var(Arr::get($account, 'suspended'), FILTER_VALIDATE_BOOLEAN)
            ? Service::STATUS_SUSPENDED
            : Service::STATUS_ACTIVE;
    }

    private function toMegabytes(mixed $value, bool $numericIsBytes = false): int
    {
        if ($value === null || $value === '') {
            return 0;
        }

        if (is_numeric($value)) {
            return $numericIsBytes
                ? max(0, (int) round(((float) $value) / (1024 * 1024)))
                : max(0, (int) round((float) $value));
        }

        if (! is_string($value)) {
            return 0;
        }

        if (! preg_match('/([\d.]+)\s*([a-zA-Z]*)/', trim($value), $matches)) {
            return 0;
        }

        $amount = (float) $matches[1];
        $unit = strtolower($matches[2] ?: 'mb');

        return match ($unit) {
            'tb' => (int) round($amount * 1024 * 1024),
            'gb' => (int) round($amount * 1024),
            'mb', 'm' => (int) round($amount),
            'kb', 'k' => (int) round($amount / 1024),
            'b', 'bytes' => (int) round($amount / (1024 * 1024)),
            'unlimited', 'infinity' => 0,
            default => (int) round($amount),
        };
    }

    private function summarizeResponse(array $response, string $username, ?string $package = null): array
    {
        return array_filter([
            'driver' => $this->code(),
            'username' => $username,
            'package' => $package,
            'metadata' => Arr::only(Arr::get($response, 'metadata', []), ['result', 'reason', 'command', 'version']),
            'data' => Arr::only(Arr::get($response, 'data', []), ['user', 'domain', 'ip', 'nameserver', 'nameserver2']),
        ], static fn (mixed $value): bool => $value !== null && $value !== []);
    }

    private function logInsecureSslUsage(Server $server): void
    {
        if ($server->verify_ssl === false) {
            Log::critical('cPanel provisioning is running with ssl_verify disabled.', [
                'driver' => $this->code(),
                'tenant_id' => $server->tenant_id,
                'server_id' => $server->id,
                'hostname' => $server->hostname,
            ]);
        }
    }
}
