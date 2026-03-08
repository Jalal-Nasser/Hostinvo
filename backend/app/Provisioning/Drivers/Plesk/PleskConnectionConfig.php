<?php

namespace App\Provisioning\Drivers\Plesk;

use App\Models\Server;
use App\Provisioning\Exceptions\ProvisioningException;
use Illuminate\Support\Arr;

readonly class PleskConnectionConfig
{
    public function __construct(
        public ?string $username,
        public ?string $apiKey,
        public ?string $apiSecret,
        public string $apiBaseUrl,
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
        $apiKey = trim((string) Arr::get($credentials, 'api_key', ''));
        $apiSecret = trim((string) Arr::get($credentials, 'api_secret', ''));

        if ($apiKey === '' && ($username === '' || $apiSecret === '')) {
            throw new ProvisioningException(
                __('provisioning.plesk.credentials_missing'),
                requestPayload: ['server_id' => $server->id],
                responsePayload: [
                    'missing' => array_values(array_filter([
                        $apiKey === '' && $username === '' ? 'username' : null,
                        $apiKey === '' && $apiSecret === '' ? 'api_secret' : null,
                        $apiKey === '' ? 'api_key_or_basic_auth' : null,
                    ])),
                ],
            );
        }

        return new self(
            username: $username !== '' ? $username : null,
            apiKey: $apiKey !== '' ? $apiKey : null,
            apiSecret: $apiSecret !== '' ? $apiSecret : null,
            apiBaseUrl: self::normalizeBaseUrl($server),
            verifySsl: (bool) $server->verify_ssl,
            timeout: max(5, (int) config('provisioning.plesk.timeout', 30)),
            connectTimeout: max(2, (int) config('provisioning.plesk.connect_timeout', 10)),
            retryTimes: max(1, (int) config('provisioning.plesk.retry_times', 3)),
            retrySleepMs: max(100, (int) config('provisioning.plesk.retry_sleep_ms', 500)),
        );
    }

    private static function normalizeBaseUrl(Server $server): string
    {
        $endpoint = trim((string) ($server->api_endpoint ?: $server->hostname));

        if ($endpoint === '') {
            throw new ProvisioningException(
                __('provisioning.plesk.endpoint_missing'),
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
                __('provisioning.plesk.endpoint_invalid'),
                requestPayload: ['server_id' => $server->id, 'api_endpoint' => $server->api_endpoint],
            );
        }

        $scheme = ($parts['scheme'] ?? 'https') === 'http' ? 'http' : 'https';
        $port = $parts['port'] ?? $server->api_port ?? (int) config('provisioning.plesk.default_port', 8443);
        $path = rtrim((string) ($parts['path'] ?? ''), '/');

        if ($path === '' || $path === '/') {
            $path = '/api/v2';
        } elseif (! str_ends_with($path, '/api/v2')) {
            $path .= '/api/v2';
        }

        return sprintf('%s://%s:%d%s', $scheme, $host, (int) $port, $path);
    }
}
