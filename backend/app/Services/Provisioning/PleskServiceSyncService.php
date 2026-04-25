<?php

namespace App\Services\Provisioning;

use App\Models\ProvisioningLog;
use App\Models\Server;
use App\Models\Service;
use App\Provisioning\Drivers\Plesk\PleskApiClient;
use App\Provisioning\ProvisioningLogger;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PleskServiceSyncService
{
    public function __construct(
        private readonly PleskApiClient $plesk,
        private readonly ProvisioningLogger $logger,
    ) {}

    public function sync(Server $server): array
    {
        $server = $this->resolvePleskServer($server);
        $subscriptions = collect($this->plesk->listRestSubscriptions($server))
            ->filter(static fn (mixed $record): bool => is_array($record))
            ->map(fn (array $record): array => $this->normalizeSubscription($record))
            ->filter(fn (array $record): bool => filled($record['id']) && (filled($record['domain']) || filled($record['username'])))
            ->values();

        $byDomain = [];
        $byUsername = [];

        foreach ($subscriptions as $subscription) {
            if (filled($subscription['domain']) && ! isset($byDomain[$subscription['domain']])) {
                $byDomain[$subscription['domain']] = $subscription;
            }

            if (filled($subscription['username']) && ! isset($byUsername[$subscription['username']])) {
                $byUsername[$subscription['username']] = $subscription;
            }
        }

        $services = Service::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $server->tenant_id)
            ->where('external_reference', 'like', 'whmcs-hosting:%')
            ->orderBy('id')
            ->get();

        $summary = [
            'server_id' => $server->id,
            'subscriptions_seen' => $subscriptions->count(),
            'services_scanned' => $services->count(),
            'matched' => 0,
            'updated' => 0,
            'unmatched' => 0,
        ];
        $matches = [];

        DB::transaction(function () use ($server, $services, $byDomain, $byUsername, &$summary, &$matches): void {
            foreach ($services as $service) {
                [$subscription, $matchedBy] = $this->findMatch($service, $byDomain, $byUsername);

                if (! $subscription) {
                    $summary['unmatched']++;

                    continue;
                }

                $summary['matched']++;
                $this->linkService($service, $server, $subscription, $matchedBy);
                $summary['updated']++;
                $matches[] = [
                    'service_id' => $service->id,
                    'external_reference' => $service->external_reference,
                    'subscription_id' => $subscription['id'],
                    'matched_by' => $matchedBy,
                ];
            }

            $this->logger->recordServerEvent(
                server: $server,
                operation: 'plesk_sync_services',
                status: ProvisioningLog::STATUS_COMPLETED,
                message: sprintf('Linked %d imported WHMCS service(s) to existing Plesk subscription(s).', $summary['updated']),
                requestPayload: [
                    'server_id' => $server->id,
                    'source' => 'whmcs-hosting',
                ],
                responsePayload: [
                    'summary' => $summary,
                    'matches' => $matches,
                ],
            );
        });

        $summary['matches'] = $matches;

        return $summary;
    }

    private function resolvePleskServer(Server $server): Server
    {
        $server = Server::query()->withoutGlobalScopes()->find($server->getKey()) ?? $server;

        if ($server->panel_type !== Server::PANEL_PLESK) {
            throw ValidationException::withMessages([
                'server' => ['Service sync is available only for Plesk servers.'],
            ]);
        }

        return $server;
    }

    /**
     * @param  array<string, mixed>  $record
     * @return array{id: string, domain: ?string, username: ?string, name: ?string, status: ?string}
     */
    private function normalizeSubscription(array $record): array
    {
        $name = $this->extractString($record, ['name', 'subscription_name', 'subscription']);

        return [
            'id' => (string) $this->extractString($record, ['id', 'subscription_id', 'uuid', 'guid']),
            'domain' => $this->normalizeDomain($this->extractString($record, [
                'domain',
                'domain_name',
                'main_domain',
                'mainDomain',
                'hosting.domain',
                'hosting.domain.name',
                'webspace.name',
                'name',
            ])),
            'username' => $this->normalizeUsername($this->extractString($record, [
                'username',
                'login',
                'system_user',
                'sys_user',
                'hosting.username',
                'hosting.login',
                'hosting.system_user',
                'hosting.ftp_login',
                'hosting.ftpLogin',
                'owner.login',
            ])),
            'name' => $name,
            'status' => $this->extractString($record, ['status', 'state', 'subscription_status']),
        ];
    }

    /**
     * @param  array<string, array{id: string, domain: ?string, username: ?string, name: ?string, status: ?string}>  $byDomain
     * @param  array<string, array{id: string, domain: ?string, username: ?string, name: ?string, status: ?string}>  $byUsername
     * @return array{0: ?array{id: string, domain: ?string, username: ?string, name: ?string, status: ?string}, 1: ?string}
     */
    private function findMatch(Service $service, array $byDomain, array $byUsername): array
    {
        $domain = $this->normalizeDomain($service->domain);

        if ($domain !== null && isset($byDomain[$domain])) {
            return [$byDomain[$domain], 'domain'];
        }

        $username = $this->normalizeUsername($service->username);

        if ($username !== null && isset($byUsername[$username])) {
            return [$byUsername[$username], 'username'];
        }

        return [null, null];
    }

    /**
     * @param  array{id: string, domain: ?string, username: ?string, name: ?string, status: ?string}  $subscription
     */
    private function linkService(Service $service, Server $server, array $subscription, string $matchedBy): void
    {
        $metadata = (array) ($service->metadata ?? []);
        $metadata['plesk_sync'] = [
            'subscription_id' => $subscription['id'],
            'subscription_name' => $subscription['name'],
            'matched_by' => $matchedBy,
            'remote_status' => $subscription['status'],
            'synced_at' => now()->toIso8601String(),
        ];

        $attributes = [
            'server_id' => $server->id,
            'external_id' => $subscription['id'],
            'provisioning_state' => Service::PROVISIONING_SYNCED,
            'last_operation' => 'plesk_sync_services',
            'last_synced_at' => now(),
            'metadata' => $metadata,
        ];

        if ($this->isActiveStatus($subscription['status'])) {
            $attributes['status'] = Service::STATUS_ACTIVE;
            $attributes['activated_at'] = $service->activated_at ?? now();
            $attributes['suspended_at'] = null;
        }

        $service->forceFill($attributes);
        $service->save();
    }

    private function extractString(array $record, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = Arr::get($record, $key);

            if (filled($value) && is_scalar($value)) {
                return trim((string) $value);
            }
        }

        return null;
    }

    private function normalizeDomain(?string $domain): ?string
    {
        if (! filled($domain)) {
            return null;
        }

        $domain = Str::lower(trim((string) $domain));

        if (str_contains($domain, '://')) {
            $domain = (string) parse_url($domain, PHP_URL_HOST);
        }

        $domain = trim(preg_replace('/[\/?#].*$/', '', $domain) ?: $domain);
        $domain = rtrim($domain, '.');

        return $domain === '' ? null : $domain;
    }

    private function normalizeUsername(?string $username): ?string
    {
        if (! filled($username)) {
            return null;
        }

        $username = Str::lower(trim((string) $username));

        return $username === '' ? null : $username;
    }

    private function isActiveStatus(?string $status): bool
    {
        if (! filled($status)) {
            return false;
        }

        $normalized = Str::of((string) $status)
            ->lower()
            ->replace([' ', '_', '-'], '')
            ->toString();

        return in_array($normalized, ['active', 'enabled', 'ok', 'true', '0'], true);
    }
}
