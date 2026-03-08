<?php

namespace App\Provisioning\Drivers\Cpanel;

use App\Models\Service;
use App\Models\Server;
use App\Provisioning\Contracts\ProvisioningDriverInterface;
use App\Provisioning\Data\ProvisioningContext;
use App\Provisioning\Data\ProvisioningResult;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class CpanelDriver implements ProvisioningDriverInterface
{
    public function __construct(private readonly CpanelApiClient $client)
    {
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
        return $this->client->testConnection($server);
    }

    public function createAccount(ProvisioningContext $context): ProvisioningResult
    {
        $package = $this->resolvePackageName($context);
        $domain = $this->resolvePrimaryDomain($context);
        $username = $this->generateUsername($context);
        $password = $this->resolvePassword($context);

        if ($package === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.cpanel.package_mapping_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        if ($domain === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.cpanel.domain_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        if ($username === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.cpanel.username_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        $requestPayload = [
            'username' => $username,
            'domain' => $domain,
            'plan' => $package,
            'contactemail' => $context->service->client?->email,
        ];

        $response = $this->client->createAccount($context->server, array_merge($requestPayload, [
            'password' => $password,
        ]));

        return ProvisioningResult::success(
            message: __('provisioning.cpanel.account_created', ['username' => $username]),
            requestPayload: $requestPayload,
            responsePayload: $this->summarizeResponse($response, $username, $package),
            serviceAttributes: [
                'username' => $username,
                'external_reference' => $username,
                'provisioning_state' => Service::PROVISIONING_SYNCED,
            ],
            operationPayload: [
                'username' => $username,
                'password' => $password,
                'domain' => $domain,
            ],
        );
    }

    public function suspendAccount(ProvisioningContext $context): ProvisioningResult
    {
        $username = $this->resolveExistingUsername($context);

        if ($username === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.cpanel.username_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        $reason = trim((string) ($context->payload['reason'] ?? 'Suspended by Hostinvo.'));
        $requestPayload = [
            'user' => $username,
            'reason' => $reason,
        ];

        $response = $this->client->suspendAccount($context->server, $requestPayload);

        return ProvisioningResult::success(
            message: __('provisioning.cpanel.account_suspended', ['username' => $username]),
            requestPayload: $requestPayload,
            responsePayload: $this->summarizeResponse($response, $username),
            serviceAttributes: [
                'provisioning_state' => Service::PROVISIONING_SYNCED,
            ],
        );
    }

    public function unsuspendAccount(ProvisioningContext $context): ProvisioningResult
    {
        $username = $this->resolveExistingUsername($context);

        if ($username === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.cpanel.username_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        $requestPayload = [
            'user' => $username,
        ];

        $response = $this->client->unsuspendAccount($context->server, $requestPayload);

        return ProvisioningResult::success(
            message: __('provisioning.cpanel.account_unsuspended', ['username' => $username]),
            requestPayload: $requestPayload,
            responsePayload: $this->summarizeResponse($response, $username),
            serviceAttributes: [
                'provisioning_state' => Service::PROVISIONING_SYNCED,
            ],
        );
    }

    public function terminateAccount(ProvisioningContext $context): ProvisioningResult
    {
        $username = $this->resolveExistingUsername($context);

        if ($username === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.cpanel.username_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        $requestPayload = [
            'user' => $username,
            'keepdns' => 0,
        ];

        $response = $this->client->terminateAccount($context->server, $requestPayload);

        return ProvisioningResult::success(
            message: __('provisioning.cpanel.account_terminated', ['username' => $username]),
            requestPayload: $requestPayload,
            responsePayload: $this->summarizeResponse($response, $username),
            serviceAttributes: [
                'provisioning_state' => Service::PROVISIONING_SYNCED,
            ],
        );
    }

    public function changePackage(ProvisioningContext $context): ProvisioningResult
    {
        $username = $this->resolveExistingUsername($context);
        $package = trim((string) ($context->payload['panel_package_name'] ?? $this->resolvePackageName($context)));

        if ($username === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.cpanel.username_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        if ($package === '') {
            return ProvisioningResult::failure(
                message: __('provisioning.cpanel.package_mapping_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        $requestPayload = [
            'user' => $username,
            'pkg' => $package,
        ];

        $response = $this->client->changePackage($context->server, $requestPayload);

        return ProvisioningResult::success(
            message: __('provisioning.cpanel.package_changed', ['username' => $username]),
            requestPayload: $requestPayload,
            responsePayload: $this->summarizeResponse($response, $username, $package),
            serviceAttributes: [
                'provisioning_state' => Service::PROVISIONING_SYNCED,
            ],
            operationPayload: [
                'panel_package_name' => $package,
            ],
        );
    }

    public function resetPassword(ProvisioningContext $context): ProvisioningResult
    {
        $username = $this->resolveExistingUsername($context);
        $password = $this->resolvePassword($context);

        if ($username === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.cpanel.username_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        $requestPayload = [
            'user' => $username,
        ];

        $response = $this->client->resetPassword($context->server, array_merge($requestPayload, [
            'pass' => $password,
        ]));

        return ProvisioningResult::success(
            message: __('provisioning.cpanel.password_reset', ['username' => $username]),
            requestPayload: $requestPayload,
            responsePayload: $this->summarizeResponse($response, $username),
            serviceAttributes: [
                'provisioning_state' => Service::PROVISIONING_SYNCED,
            ],
            operationPayload: [
                'password' => $password,
            ],
        );
    }

    public function syncUsage(ProvisioningContext $context): ProvisioningResult
    {
        $username = $this->resolveExistingUsername($context);

        if ($username === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.cpanel.username_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        $account = $this->client->findAccount($context->server, $username);

        if (! $account) {
            return ProvisioningResult::failure(
                message: __('provisioning.cpanel.account_missing'),
                requestPayload: ['username' => $username],
            );
        }

        $bandwidth = $this->client->fetchBandwidth($context->server, $username);

        return ProvisioningResult::success(
            message: __('provisioning.cpanel.usage_synced', ['username' => $username]),
            requestPayload: ['username' => $username],
            responsePayload: [
                'account' => Arr::only($account, ['user', 'domain', 'plan', 'diskused', 'disklimit', 'suspended']),
                'bandwidth' => Arr::only($bandwidth, ['totalbytes', 'bwlimit']),
            ],
            serviceAttributes: [
                'username' => $username,
                'external_reference' => $username,
                'provisioning_state' => Service::PROVISIONING_SYNCED,
            ],
            operationPayload: [
                'disk_used_mb' => $this->toMegabytes(Arr::get($account, 'diskused')),
                'disk_limit_mb' => $this->toMegabytes(Arr::get($account, 'disklimit')),
                'bandwidth_used_mb' => $this->toMegabytes(Arr::get($bandwidth, 'totalbytes') ?? Arr::get($bandwidth, 'total'), true),
                'bandwidth_limit_mb' => $this->toMegabytes(Arr::get($bandwidth, 'bwlimit') ?? Arr::get($account, 'maxbw'), true),
                'service_status' => $this->determineServiceStatus($account),
                'suspend_reason' => Arr::get($account, 'suspendreason'),
            ],
        );
    }

    public function syncServiceStatus(ProvisioningContext $context): ProvisioningResult
    {
        $username = $this->resolveExistingUsername($context);

        if ($username === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.cpanel.username_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        $account = $this->client->findAccount($context->server, $username);

        if (! $account) {
            return ProvisioningResult::failure(
                message: __('provisioning.cpanel.account_missing'),
                requestPayload: ['username' => $username],
            );
        }

        return ProvisioningResult::success(
            message: __('provisioning.cpanel.status_synced', ['username' => $username]),
            requestPayload: ['username' => $username],
            responsePayload: [
                'account' => Arr::only($account, ['user', 'domain', 'plan', 'suspended', 'suspendreason']),
            ],
            serviceAttributes: [
                'username' => $username,
                'external_reference' => $username,
                'provisioning_state' => Service::PROVISIONING_SYNCED,
            ],
            operationPayload: [
                'service_status' => $this->determineServiceStatus($account),
                'suspend_reason' => Arr::get($account, 'suspendreason'),
                'panel_package_name' => Arr::get($account, 'plan'),
            ],
        );
    }

    private function resolvePackageName(ProvisioningContext $context): ?string
    {
        $package = trim((string) ($context->payload['panel_package_name'] ?? $context->serverPackage?->panel_package_name ?? ''));

        return $package !== '' ? $package : null;
    }

    private function resolvePrimaryDomain(ProvisioningContext $context): ?string
    {
        $domain = trim((string) ($context->payload['domain'] ?? $context->service->domain ?? ''));

        return $domain !== '' ? $domain : null;
    }

    private function resolveExistingUsername(ProvisioningContext $context): ?string
    {
        return $this->normalizeUsername(
            (string) ($context->payload['username'] ?? $context->service->username ?? $context->service->external_reference ?? '')
        );
    }

    private function generateUsername(ProvisioningContext $context): ?string
    {
        $preferred = $this->resolveExistingUsername($context);

        if ($preferred !== null) {
            return $preferred;
        }

        $domain = $this->resolvePrimaryDomain($context);

        if ($domain === null) {
            return null;
        }

        return $this->normalizeUsername(Str::before($domain, '.'));
    }

    private function normalizeUsername(string $value): ?string
    {
        $normalized = strtolower(preg_replace('/[^a-z0-9]/', '', $value) ?? '');

        if ($normalized === '') {
            return null;
        }

        if (is_numeric($normalized[0])) {
            $normalized = 'h' . $normalized;
        }

        $normalized = substr($normalized, 0, 16);

        if (strlen($normalized) < 5) {
            $normalized .= substr(strtolower(Str::random(5)), 0, 5 - strlen($normalized));
        }

        return $normalized;
    }

    private function resolvePassword(ProvisioningContext $context): string
    {
        $password = trim((string) ($context->payload['password'] ?? ''));

        return $password !== '' ? $password : Str::password(20);
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
            'data' => Arr::only(Arr::get($response, 'data', []), ['user', 'domain', 'ip', 'nameserver']),
        ], static fn (mixed $value): bool => $value !== null && $value !== []);
    }
}
