<?php

namespace App\Provisioning\Drivers\Cpanel;

use App\Models\Server;
use App\Provisioning\Exceptions\ProvisioningException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Throwable;

class CpanelApiClient
{
    public function testConnection(Server $server): array
    {
        $payload = $this->request($server, 'version');

        return [
            'driver' => 'cpanel',
            'label' => 'cPanel / WHM',
            'successful' => true,
            'message' => __('provisioning.cpanel.connection_successful'),
            'version' => Arr::get($payload, 'data.version') ?? Arr::get($payload, 'version'),
            'metadata' => $this->summarizeMetadata($payload),
        ];
    }

    public function createAccount(Server $server, array $parameters): array
    {
        return $this->request($server, 'createacct', $parameters);
    }

    public function suspendAccount(Server $server, array $parameters): array
    {
        return $this->request($server, 'suspendacct', $parameters);
    }

    public function unsuspendAccount(Server $server, array $parameters): array
    {
        return $this->request($server, 'unsuspendacct', $parameters);
    }

    public function terminateAccount(Server $server, array $parameters): array
    {
        return $this->request($server, 'removeacct', $parameters);
    }

    public function changePackage(Server $server, array $parameters): array
    {
        return $this->request($server, 'changepackage', $parameters);
    }

    public function resetPassword(Server $server, array $parameters): array
    {
        return $this->request($server, 'passwd', $parameters);
    }

    public function findAccount(Server $server, string $username): ?array
    {
        $payload = $this->request($server, 'listaccts', [
            'search' => $username,
            'searchtype' => 'user',
            'want' => 'user,domain,plan,suspended,suspendreason,diskused,disklimit,partition,email',
        ]);

        $accounts = Arr::get($payload, 'data.acct', []);

        if (! is_array($accounts)) {
            return null;
        }

        foreach ($accounts as $account) {
            if (is_array($account) && Arr::get($account, 'user') === $username) {
                return $account;
            }
        }

        return null;
    }

    public function fetchBandwidth(Server $server, string $username): array
    {
        $payload = $this->request($server, 'showbw', [
            'search' => $username,
            'searchtype' => 'user',
        ]);

        $accounts = Arr::get($payload, 'data.acct', []);

        if (! is_array($accounts)) {
            return [];
        }

        foreach ($accounts as $account) {
            if (is_array($account) && Arr::get($account, 'user') === $username) {
                return $account;
            }
        }

        return [];
    }

    private function request(Server $server, string $function, array $parameters = []): array
    {
        $config = CpanelConnectionConfig::fromServer($server);
        $url = rtrim($config->whmBaseUrl, '/') . "/json-api/{$function}";
        $query = array_filter(
            array_merge(['api.version' => 1], $parameters),
            static fn (mixed $value): bool => $value !== null && $value !== ''
        );

        $response = null;
        $exception = null;

        for ($attempt = 1; $attempt <= $config->retryTimes; $attempt++) {
            try {
                $response = Http::acceptJson()
                    ->withHeaders([
                        'Authorization' => sprintf('whm %s:%s', $config->username, $config->apiToken),
                    ])
                    ->withOptions([
                        'verify' => $config->verifySsl,
                    ])
                    ->connectTimeout($config->connectTimeout)
                    ->timeout($config->timeout)
                    ->get($url, $query);
            } catch (ConnectionException $caught) {
                $exception = $caught;

                if ($attempt < $config->retryTimes) {
                    usleep($config->retrySleepMs * 1000);
                    continue;
                }
            } catch (Throwable $caught) {
                $exception = $caught;
            }

            if ($response?->serverError() && $attempt < $config->retryTimes) {
                usleep($config->retrySleepMs * 1000);
                continue;
            }

            break;
        }

        if (! $response) {
            throw new ProvisioningException(
                __('provisioning.cpanel.connection_failed'),
                requestPayload: [
                    'function' => $function,
                    'parameters' => $parameters,
                ],
                responsePayload: [
                    'exception' => $exception?->getMessage(),
                ],
                previous: $exception,
            );
        }

        $body = $response->json();
        $responsePayload = is_array($body)
            ? $body
            : ['raw_body' => $response->body()];

        if (! $response->successful()) {
            throw new ProvisioningException(
                __('provisioning.cpanel.request_failed', ['operation' => $function]),
                requestPayload: [
                    'function' => $function,
                    'parameters' => $parameters,
                ],
                responsePayload: array_merge($responsePayload, ['http_status' => $response->status()]),
            );
        }

        if (! is_array($body)) {
            throw new ProvisioningException(
                __('provisioning.cpanel.invalid_response'),
                requestPayload: [
                    'function' => $function,
                    'parameters' => $parameters,
                ],
                responsePayload: $responsePayload,
            );
        }

        if (! $this->indicatesSuccess($body)) {
            throw new ProvisioningException(
                $this->extractFailureMessage($function, $body),
                requestPayload: [
                    'function' => $function,
                    'parameters' => $parameters,
                ],
                responsePayload: $body,
            );
        }

        return $body;
    }

    private function indicatesSuccess(array $payload): bool
    {
        $metadataResult = Arr::get($payload, 'metadata.result');

        if ($metadataResult !== null) {
            return (int) $metadataResult === 1;
        }

        $status = Arr::get($payload, 'status');

        if ($status !== null) {
            return in_array($status, [1, '1', true, 'success'], true);
        }

        $errors = Arr::get($payload, 'errors');

        if (is_array($errors) && $errors !== []) {
            return false;
        }

        return true;
    }

    private function extractFailureMessage(string $function, array $payload): string
    {
        $reason = Arr::get($payload, 'metadata.reason')
            ?? Arr::get($payload, 'metadata.command')
            ?? Arr::get($payload, 'error')
            ?? Arr::get($payload, 'statusmsg');

        $errors = Arr::get($payload, 'errors');

        if (is_array($errors) && $errors !== []) {
            $reason = $errors[0] ?? $reason;
        }

        return $reason
            ? (string) $reason
            : __('provisioning.cpanel.request_failed', ['operation' => $function]);
    }

    private function summarizeMetadata(array $payload): array
    {
        return array_filter([
            'version' => Arr::get($payload, 'data.version') ?? Arr::get($payload, 'version'),
            'command' => Arr::get($payload, 'metadata.command'),
            'result' => Arr::get($payload, 'metadata.result'),
            'reason' => Arr::get($payload, 'metadata.reason'),
        ], static fn (mixed $value): bool => $value !== null && $value !== '');
    }
}
