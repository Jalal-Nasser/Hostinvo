<?php

namespace App\Provisioning\Drivers\Cpanel;

use App\Models\Server;
use App\Provisioning\Exceptions\ProvisioningException;
use Illuminate\Support\Arr;

readonly class CpanelConnectionConfig
{
    public function __construct(
        public string $username,
        public string $apiToken,
        public string $whmBaseUrl,
        public bool $verifySsl,
        public int $timeout,
        public int $connectTimeout,
        public int $retryTimes,
        public int $retrySleepMs,
    ) {
    }

    public static function fromServer(Server $server): self
    {
        $credentials = (array) ($server->credentials ?? []);
        $username = trim((string) ($server->username ?: Arr::get($credentials, 'username', '')));
        $apiToken = trim((string) Arr::get($credentials, 'api_token', ''));

        if ($username === '' || $apiToken === '') {
            throw new ProvisioningException(
                __('provisioning.cpanel.credentials_missing'),
                requestPayload: ['server_id' => $server->id],
                responsePayload: [
                    'missing' => array_values(array_filter([
                        $username === '' ? 'username' : null,
                        $apiToken === '' ? 'api_token' : null,
                    ])),
                ],
            );
        }

        return new self(
            username: $username,
            apiToken: $apiToken,
            whmBaseUrl: self::normalizeBaseUrl($server),
            verifySsl: (bool) $server->verify_ssl,
            timeout: max(5, (int) config('provisioning.cpanel.timeout', 30)),
            connectTimeout: max(2, (int) config('provisioning.cpanel.connect_timeout', 10)),
            retryTimes: max(1, (int) config('provisioning.cpanel.retry_times', 3)),
            retrySleepMs: max(100, (int) config('provisioning.cpanel.retry_sleep_ms', 500)),
        );
    }

    private static function normalizeBaseUrl(Server $server): string
    {
        $endpoint = trim((string) ($server->api_endpoint ?: $server->hostname));

        if ($endpoint === '') {
            throw new ProvisioningException(
                __('provisioning.cpanel.endpoint_missing'),
                requestPayload: ['server_id' => $server->id],
            );
        }

        if (! preg_match('/^https?:\/\//i', $endpoint)) {
            $endpoint = 'https://' . $endpoint;
        }

        $parts = parse_url($endpoint);
        $host = $parts['host'] ?? null;

        if (! is_string($host) || $host === '') {
            throw new ProvisioningException(
                __('provisioning.cpanel.endpoint_invalid'),
                requestPayload: ['server_id' => $server->id, 'api_endpoint' => $server->api_endpoint],
            );
        }

        $scheme = ($parts['scheme'] ?? 'https') === 'http' ? 'http' : 'https';
        $port = $parts['port'] ?? $server->api_port ?? (int) config('provisioning.cpanel.default_port', 2087);

        return sprintf('%s://%s:%d', $scheme, $host, (int) $port);
    }
}
