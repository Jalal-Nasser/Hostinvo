<?php

namespace App\Provisioning\Drivers\Plesk;

use App\Models\Service;
use App\Models\Server;
use App\Provisioning\Contracts\ProvisioningDriverInterface;
use App\Provisioning\Data\ProvisioningContext;
use App\Provisioning\Data\ProvisioningResult;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class PleskDriver implements ProvisioningDriverInterface
{
    public function __construct(private readonly PleskApiClient $client)
    {
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
        return $this->client->testConnection($server);
    }

    public function createAccount(ProvisioningContext $context): ProvisioningResult
    {
        $servicePlan = $this->resolveServicePlan($context);
        $subscription = $this->resolveSubscription($context);
        $username = $this->resolveOrGenerateUsername($context);
        $password = $this->resolvePassword($context);
        $targetIp = $this->resolveTargetIp($context);
        $owner = $this->resolveOwnerLogin($context->server);

        if ($servicePlan === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.plesk.package_mapping_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        if ($subscription === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.plesk.domain_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        if ($username === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.plesk.username_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        if ($targetIp === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.plesk.ip_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        $requestPayload = [
            'subscription' => $subscription,
            'service_plan' => $servicePlan,
            'username' => $username,
            'ip' => $targetIp,
            'owner' => $owner,
            'contact_email' => $context->service->client?->email,
        ];

        $response = $this->client->subscriptionCommand($context->server, [
            '--create',
            $subscription,
            '-service-plan',
            $servicePlan,
            '-login',
            $username,
            '-passwd',
            $password,
            '-ip',
            $targetIp,
            '-owner',
            $owner,
        ]);

        return ProvisioningResult::success(
            message: __('provisioning.plesk.account_created', ['subscription' => $subscription]),
            requestPayload: $requestPayload,
            responsePayload: $this->summarizeResponse($response, $subscription, $servicePlan),
            serviceAttributes: [
                'external_reference' => $subscription,
                'provisioning_state' => Service::PROVISIONING_SYNCED,
                'metadata' => $this->mergeServiceMetadata($context, [
                    'driver' => $this->code(),
                    'subscription' => $subscription,
                    'service_plan' => $servicePlan,
                    'panel_owner' => $owner,
                ]),
            ],
            operationPayload: [
                'domain' => $subscription,
                'username' => $username,
                'password' => $password,
                'panel_package_name' => $servicePlan,
                'service_status' => Service::STATUS_ACTIVE,
            ],
        );
    }

    public function suspendAccount(ProvisioningContext $context): ProvisioningResult
    {
        $subscription = $this->resolveSubscription($context);

        if ($subscription === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.plesk.domain_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        $response = $this->client->subscriptionCommand($context->server, [
            '--webspace-off',
            $subscription,
        ]);

        return ProvisioningResult::success(
            message: __('provisioning.plesk.account_suspended', ['subscription' => $subscription]),
            requestPayload: ['subscription' => $subscription],
            responsePayload: $this->summarizeResponse($response, $subscription),
            serviceAttributes: [
                'provisioning_state' => Service::PROVISIONING_SYNCED,
            ],
        );
    }

    public function unsuspendAccount(ProvisioningContext $context): ProvisioningResult
    {
        $subscription = $this->resolveSubscription($context);

        if ($subscription === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.plesk.domain_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        $response = $this->client->subscriptionCommand($context->server, [
            '--webspace-on',
            $subscription,
        ]);

        return ProvisioningResult::success(
            message: __('provisioning.plesk.account_unsuspended', ['subscription' => $subscription]),
            requestPayload: ['subscription' => $subscription],
            responsePayload: $this->summarizeResponse($response, $subscription),
            serviceAttributes: [
                'provisioning_state' => Service::PROVISIONING_SYNCED,
            ],
        );
    }

    public function terminateAccount(ProvisioningContext $context): ProvisioningResult
    {
        $subscription = $this->resolveSubscription($context);

        if ($subscription === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.plesk.domain_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        $response = $this->client->subscriptionCommand($context->server, [
            '--remove',
            $subscription,
        ]);

        return ProvisioningResult::success(
            message: __('provisioning.plesk.account_terminated', ['subscription' => $subscription]),
            requestPayload: ['subscription' => $subscription],
            responsePayload: $this->summarizeResponse($response, $subscription),
            serviceAttributes: [
                'provisioning_state' => Service::PROVISIONING_SYNCED,
            ],
        );
    }

    public function changePackage(ProvisioningContext $context): ProvisioningResult
    {
        $subscription = $this->resolveSubscription($context);
        $servicePlan = trim((string) ($context->payload['panel_package_name'] ?? $this->resolveServicePlan($context)));

        if ($subscription === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.plesk.domain_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        if ($servicePlan === '') {
            return ProvisioningResult::failure(
                message: __('provisioning.plesk.package_mapping_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        $response = $this->client->subscriptionCommand($context->server, [
            '--switch-subscription',
            $subscription,
            '-service-plan',
            $servicePlan,
        ]);

        return ProvisioningResult::success(
            message: __('provisioning.plesk.package_changed', ['subscription' => $subscription]),
            requestPayload: [
                'subscription' => $subscription,
                'service_plan' => $servicePlan,
            ],
            responsePayload: $this->summarizeResponse($response, $subscription, $servicePlan),
            serviceAttributes: [
                'provisioning_state' => Service::PROVISIONING_SYNCED,
                'metadata' => $this->mergeServiceMetadata($context, [
                    'driver' => $this->code(),
                    'subscription' => $subscription,
                    'service_plan' => $servicePlan,
                ]),
            ],
            operationPayload: [
                'panel_package_name' => $servicePlan,
            ],
        );
    }

    public function resetPassword(ProvisioningContext $context): ProvisioningResult
    {
        $subscription = $this->resolveSubscription($context);
        $password = $this->resolvePassword($context);
        $username = $this->resolveExistingUsername($context);

        if ($subscription === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.plesk.domain_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        $parameters = [
            '--update',
            $subscription,
            '-passwd',
            $password,
        ];

        if ($username !== null) {
            $parameters = array_merge($parameters, ['-login', $username]);
        }

        $response = $this->client->subscriptionCommand($context->server, $parameters);

        return ProvisioningResult::success(
            message: __('provisioning.plesk.password_reset', ['subscription' => $subscription]),
            requestPayload: [
                'subscription' => $subscription,
                'username' => $username,
            ],
            responsePayload: $this->summarizeResponse($response, $subscription),
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
        $subscription = $this->resolveSubscription($context);

        if ($subscription === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.plesk.domain_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        $response = $this->client->subscriptionCommand($context->server, [
            '--info',
            $subscription,
        ]);

        $info = $this->parseSubscriptionInfo($response);

        return ProvisioningResult::success(
            message: __('provisioning.plesk.usage_synced', ['subscription' => $subscription]),
            requestPayload: ['subscription' => $subscription],
            responsePayload: [
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
            ],
            serviceAttributes: [
                'external_reference' => $subscription,
                'username' => $this->extractUsername($info) ?? $context->service->username,
                'provisioning_state' => Service::PROVISIONING_SYNCED,
                'metadata' => $this->mergeServiceMetadata($context, [
                    'driver' => $this->code(),
                    'subscription' => $subscription,
                    'service_plan' => $this->extractServicePlan($info),
                ]),
            ],
            operationPayload: [
                'disk_used_mb' => $this->toMegabytes($this->extractInfoValue($info, ['disk_space', 'disk_usage', 'disk_quota_used'])),
                'disk_limit_mb' => $this->toMegabytes($this->extractInfoValue($info, ['disk_space_limit', 'hard_disk_quota', 'disk_limit'])),
                'bandwidth_used_mb' => $this->toMegabytes($this->extractInfoValue($info, ['traffic', 'traffic_used', 'bandwidth_usage'])),
                'bandwidth_limit_mb' => $this->toMegabytes($this->extractInfoValue($info, ['traffic_limit', 'bandwidth_limit'])),
                'email_accounts_used' => (int) $this->extractInfoValue($info, ['mailboxes', 'email_accounts', 'mail_names'], 0),
                'databases_used' => (int) $this->extractInfoValue($info, ['databases', 'database_count'], 0),
                'service_status' => $this->determineServiceStatus($info),
                'suspend_reason' => $this->extractInfoValue($info, ['suspend_reason', 'reason']),
                'panel_package_name' => $this->extractServicePlan($info),
            ],
        );
    }

    public function syncServiceStatus(ProvisioningContext $context): ProvisioningResult
    {
        $subscription = $this->resolveSubscription($context);

        if ($subscription === null) {
            return ProvisioningResult::failure(
                message: __('provisioning.plesk.domain_required'),
                requestPayload: ['service_id' => $context->service->id],
            );
        }

        $response = $this->client->subscriptionCommand($context->server, [
            '--info',
            $subscription,
        ]);

        $info = $this->parseSubscriptionInfo($response);

        return ProvisioningResult::success(
            message: __('provisioning.plesk.status_synced', ['subscription' => $subscription]),
            requestPayload: ['subscription' => $subscription],
            responsePayload: [
                'driver' => $this->code(),
                'subscription' => $subscription,
                'info' => Arr::only($info, [
                    'subscription',
                    'status',
                    'service_plan',
                    'system_user',
                    'suspend_reason',
                ]),
            ],
            serviceAttributes: [
                'external_reference' => $subscription,
                'username' => $this->extractUsername($info) ?? $context->service->username,
                'provisioning_state' => Service::PROVISIONING_SYNCED,
                'metadata' => $this->mergeServiceMetadata($context, [
                    'driver' => $this->code(),
                    'subscription' => $subscription,
                    'service_plan' => $this->extractServicePlan($info),
                ]),
            ],
            operationPayload: [
                'service_status' => $this->determineServiceStatus($info),
                'suspend_reason' => $this->extractInfoValue($info, ['suspend_reason', 'reason']),
                'panel_package_name' => $this->extractServicePlan($info),
            ],
        );
    }

    private function resolveServicePlan(ProvisioningContext $context): ?string
    {
        $plan = trim((string) ($context->payload['panel_package_name'] ?? $context->serverPackage?->panel_package_name ?? ''));

        return $plan !== '' ? $plan : null;
    }

    private function resolveSubscription(ProvisioningContext $context): ?string
    {
        $subscription = trim((string) ($context->payload['domain']
            ?? $context->service->domain
            ?? $context->service->external_reference
            ?? ''));

        return $subscription !== '' ? $subscription : null;
    }

    private function resolveExistingUsername(ProvisioningContext $context): ?string
    {
        return $this->normalizeUsername(
            (string) ($context->payload['username'] ?? $context->service->username ?? '')
        );
    }

    private function resolveOrGenerateUsername(ProvisioningContext $context): ?string
    {
        $existing = $this->resolveExistingUsername($context);

        if ($existing !== null) {
            return $existing;
        }

        $subscription = $this->resolveSubscription($context);

        if ($subscription === null) {
            return null;
        }

        return $this->normalizeUsername(Str::before($subscription, '.'));
    }

    private function normalizeUsername(string $value): ?string
    {
        $normalized = strtolower(preg_replace('/[^a-z0-9]/', '', $value) ?? '');

        if ($normalized === '') {
            return null;
        }

        if (is_numeric($normalized[0])) {
            $normalized = 'p' . $normalized;
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

    private function resolveTargetIp(ProvisioningContext $context): ?string
    {
        $explicit = trim((string) ($context->payload['ip_address'] ?? ''));

        if ($explicit !== '') {
            return $explicit;
        }

        $endpoint = trim((string) ($context->server->api_endpoint ?: $context->server->hostname));

        if ($endpoint === '') {
            return null;
        }

        if (! preg_match('/^https?:\/\//i', $endpoint)) {
            $endpoint = 'https://' . $endpoint;
        }

        $host = parse_url($endpoint, PHP_URL_HOST);

        return is_string($host) && $host !== '' ? $host : null;
    }

    private function resolveOwnerLogin(Server $server): string
    {
        $owner = trim((string) ($server->username ?? ''));

        return $owner !== '' ? $owner : 'admin';
    }

    private function parseSubscriptionInfo(array $response): array
    {
        $info = [];
        $data = Arr::get($response, 'data');

        if (is_array($data)) {
            foreach ($data as $key => $value) {
                if (is_scalar($value) || $value === null) {
                    $info[Str::snake((string) $key)] = $value;
                }
            }
        }

        $stdout = trim((string) Arr::get($response, 'stdout', ''));

        if ($stdout !== '') {
            foreach (preg_split('/\r\n|\r|\n/', $stdout) ?: [] as $line) {
                if (! preg_match('/^\s*([^:]+):\s*(.+)$/', trim($line), $matches)) {
                    continue;
                }

                $key = Str::snake((string) Str::of($matches[1])->replace(['(', ')', '/'], ' ')->squish());
                $info[$key] = trim($matches[2]);
            }
        }

        return $info;
    }

    private function extractServicePlan(array $info): ?string
    {
        $plan = $this->extractInfoValue($info, ['service_plan', 'plan']);

        return filled($plan) ? (string) $plan : null;
    }

    private function extractUsername(array $info): ?string
    {
        $username = $this->extractInfoValue($info, ['system_user', 'login', 'username']);

        return filled($username) ? (string) $username : null;
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

    private function mergeServiceMetadata(ProvisioningContext $context, array $panelMetadata): array
    {
        return array_merge((array) ($context->service->metadata ?? []), [
            'panel' => array_filter($panelMetadata, static fn (mixed $value): bool => $value !== null && $value !== ''),
        ]);
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
}
