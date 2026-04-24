<?php

namespace App\Provisioning\Drivers\Plesk;

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

class PleskDriver implements ProvisioningDriverInterface
{
    private ?Server $server = null;

    private array $lastRequestPayload = [];

    private array $lastResponsePayload = [];

    public function __construct(private readonly PleskApiClient $client) {}

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
        return 'plesk';
    }

    public function label(): string
    {
        return 'Plesk';
    }

    public function testConnection(Server $server): array
    {
        $this->logInsecureSslUsage($server);

        return $this->client->testConnection($server);
    }

    public function createAccount(ProvisionPayload $payload): ProvisionResult
    {
        $subscription = trim($payload->domain);
        $servicePlan = trim($payload->packageName);
        $username = $this->normalizeUsername($payload->username);
        $targetIp = trim($payload->ip);
        $owner = $this->resolveOwnerLogin($this->server());

        $requestPayload = [
            'subscription' => $subscription,
            'service_plan' => $servicePlan,
            'username' => $username,
            'ip' => $targetIp,
            'owner' => $owner,
            'contact_email' => $payload->contactEmail ?: $payload->email,
        ];

        $response = $this->client->subscriptionCommand($this->server(), [
            '--create',
            $subscription,
            '-service-plan',
            $servicePlan,
            '-login',
            $username,
            '-passwd',
            $this->resolveServicePassword($payload->serviceId),
            '-ip',
            $targetIp,
            '-owner',
            $owner,
        ]);

        $responsePayload = $this->summarizeResponse($response, $subscription, $servicePlan);
        $this->rememberTelemetry($payload->sanitized(), $responsePayload);

        return new ProvisionResult(
            success: true,
            username: $username,
            ip: $targetIp,
            rawResponse: json_encode($responsePayload) ?: null,
        );
    }

    public function suspendAccount(string $username, string $reason): bool
    {
        $subscription = trim($username);

        $response = $this->client->subscriptionCommand($this->server(), [
            '--webspace-off',
            $subscription,
        ]);

        $this->rememberTelemetry(
            ['subscription' => $subscription, 'reason' => $reason],
            $this->summarizeResponse($response, $subscription),
        );

        return true;
    }

    public function unsuspendAccount(string $username): bool
    {
        $subscription = trim($username);

        $response = $this->client->subscriptionCommand($this->server(), [
            '--webspace-on',
            $subscription,
        ]);

        $this->rememberTelemetry(
            ['subscription' => $subscription],
            $this->summarizeResponse($response, $subscription),
        );

        return true;
    }

    public function terminateAccount(string $username): bool
    {
        $subscription = trim($username);

        $response = $this->client->subscriptionCommand($this->server(), [
            '--remove',
            $subscription,
        ]);

        $this->rememberTelemetry(
            ['subscription' => $subscription],
            $this->summarizeResponse($response, $subscription),
        );

        return true;
    }

    public function changePackage(string $username, string $package): bool
    {
        $subscription = trim($username);
        $servicePlan = trim($package);

        $response = $this->client->subscriptionCommand($this->server(), [
            '--switch-subscription',
            $subscription,
            '-service-plan',
            $servicePlan,
        ]);

        $this->rememberTelemetry(
            ['subscription' => $subscription, 'service_plan' => $servicePlan],
            $this->summarizeResponse($response, $subscription, $servicePlan),
        );

        return true;
    }

    public function resetPassword(string $username, string $serviceId): bool
    {
        $subscription = trim($username);

        $response = $this->client->subscriptionCommand($this->server(), [
            '--update',
            $subscription,
            '-passwd',
            $this->resolveServicePassword($serviceId),
        ]);

        $this->rememberTelemetry(
            ['subscription' => $subscription],
            $this->summarizeResponse($response, $subscription),
        );

        return true;
    }

    public function syncUsage(string $username): UsageData
    {
        $subscription = trim($username);
        $info = $this->client->subscriptionInfo($this->server(), $subscription);

        $responsePayload = [
            'driver' => $this->code(),
            'subscription' => $subscription,
            'info' => Arr::only($info, [
                'subscription',
                'status',
                'service_plan',
                'system_user',
                'disk_space',
                'disk_space_limit',
                'traffic',
                'traffic_limit',
                'mailboxes',
                'databases',
            ]),
        ];

        $this->rememberTelemetry(['subscription' => $subscription], $responsePayload);

        return new UsageData(
            diskUsedMb: $this->toMegabytes($this->extractInfoValue($info, ['disk_space', 'disk_usage', 'disk_quota_used'])),
            diskLimitMb: $this->toMegabytes($this->extractInfoValue($info, ['disk_space_limit', 'hard_disk_quota', 'disk_limit'])),
            bandwidthUsedMb: $this->toMegabytes($this->extractInfoValue($info, ['traffic', 'traffic_used', 'bandwidth_usage'])),
            bandwidthLimitMb: $this->toMegabytes($this->extractInfoValue($info, ['traffic_limit', 'bandwidth_limit'])),
            inodesUsed: (int) $this->extractInfoValue($info, ['inodes_used', 'inode_usage'], 0),
            emailAccountsUsed: (int) $this->extractInfoValue($info, ['mailboxes', 'email_accounts', 'mail_names'], 0),
            databasesUsed: (int) $this->extractInfoValue($info, ['databases', 'database_count'], 0),
            serviceStatus: $this->determineServiceStatus($info),
            suspendReason: $this->extractInfoValue($info, ['suspend_reason', 'reason']),
            packageName: $this->extractServicePlan($info),
            rawResponse: json_encode($responsePayload) ?: null,
        );
    }

    public function syncServiceStatus(string $username): ServiceStatus
    {
        $subscription = trim($username);
        $info = $this->client->subscriptionInfo($this->server(), $subscription);

        $responsePayload = [
            'driver' => $this->code(),
            'subscription' => $subscription,
            'info' => Arr::only($info, [
                'subscription',
                'status',
                'service_plan',
                'system_user',
                'suspend_reason',
            ]),
        ];

        $this->rememberTelemetry(['subscription' => $subscription], $responsePayload);

        return new ServiceStatus(
            status: $this->determineServiceStatus($info),
            suspendReason: $this->extractInfoValue($info, ['suspend_reason', 'reason']),
            packageName: $this->extractServicePlan($info),
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
            $normalized = 'plesk'.strtolower(Str::random(6));
        }

        if (is_numeric($normalized[0])) {
            $normalized = 'p'.$normalized;
        }

        $normalized = substr($normalized, 0, 16);

        if (strlen($normalized) < 5) {
            $normalized .= substr(strtolower(Str::random(5)), 0, 5 - strlen($normalized));
        }

        return $normalized;
    }

    private function resolveOwnerLogin(Server $server): string
    {
        $owner = trim((string) ($server->username ?? ''));

        return $owner !== '' ? $owner : 'admin';
    }

    private function extractServicePlan(array $info): ?string
    {
        $plan = $this->extractInfoValue($info, ['service_plan', 'plan']);

        return filled($plan) ? (string) $plan : null;
    }

    private function extractInfoValue(array $info, array $keys, mixed $default = null): mixed
    {
        foreach ($keys as $key) {
            $value = Arr::get($info, $key);

            if ($value !== null && $value !== '') {
                return $value;
            }
        }

        return $default;
    }

    private function determineServiceStatus(array $info): string
    {
        $status = strtolower((string) ($this->extractInfoValue($info, ['status', 'subscription_status']) ?? ''));

        return match (true) {
            str_contains($status, 'suspend'),
            str_contains($status, 'disable') => Service::STATUS_SUSPENDED,
            str_contains($status, 'terminate'),
            str_contains($status, 'remove') => Service::STATUS_TERMINATED,
            str_contains($status, 'fail'),
            str_contains($status, 'error') => Service::STATUS_FAILED,
            default => Service::STATUS_ACTIVE,
        };
    }

    private function toMegabytes(mixed $value): int
    {
        if ($value === null || $value === '') {
            return 0;
        }

        if (is_numeric($value)) {
            return max(0, (int) round((float) $value));
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

    private function summarizeResponse(array $response, string $subscription, ?string $servicePlan = null): array
    {
        return array_filter([
            'driver' => $this->code(),
            'subscription' => $subscription,
            'service_plan' => $servicePlan,
            'code' => Arr::get($response, 'code'),
            'stdout' => filled(Arr::get($response, 'stdout')) ? Str::limit((string) Arr::get($response, 'stdout'), 400) : null,
            'stderr' => filled(Arr::get($response, 'stderr')) ? Str::limit((string) Arr::get($response, 'stderr'), 400) : null,
        ], static fn (mixed $value): bool => $value !== null && $value !== '');
    }

    private function logInsecureSslUsage(Server $server): void
    {
        if ($server->verify_ssl === false) {
            Log::critical('Plesk provisioning is running with ssl_verify disabled.', [
                'driver' => $this->code(),
                'tenant_id' => $server->tenant_id,
                'server_id' => $server->id,
                'hostname' => $server->hostname,
            ]);
        }
    }
}
