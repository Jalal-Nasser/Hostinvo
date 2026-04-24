<?php

namespace App\Provisioning\Drivers\Plesk;

use App\Models\Server;
use App\Provisioning\Exceptions\ProvisioningException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Throwable;

class PleskApiClient
{
    public function listServicePlans(Server $server): array
    {
        $response = $this->servicePlanCommand($server, ['--list']);
        $stdout = trim((string) Arr::get($response, 'stdout', ''));

        if ($stdout === '') {
            return [];
        }

        return collect(preg_split('/\r\n|\r|\n/', $stdout) ?: [])
            ->map(static fn (string $line): string => trim($line))
            ->filter(static fn (string $line): bool => $line !== '')
            ->values()
            ->all();
    }

    public function servicePlanInfo(Server $server, string $plan): array
    {
        $response = $this->servicePlanCommand($server, ['--info', trim($plan)]);

        return $this->parseInfoResponse($response);
    }

    public function listSubscriptions(Server $server): array
    {
        $response = $this->subscriptionCommand($server, ['--list']);
        $stdout = trim((string) Arr::get($response, 'stdout', ''));

        if ($stdout === '') {
            return [];
        }

        return collect(preg_split('/\r\n|\r|\n/', $stdout) ?: [])
            ->map(static fn (string $line): string => trim($line))
            ->filter(static fn (string $line): bool => $line !== '')
            ->values()
            ->all();
    }

    public function subscriptionInfo(Server $server, string $subscription): array
    {
        $response = $this->subscriptionCommand($server, ['--info', trim($subscription)]);

        return $this->parseInfoResponse($response);
    }

    public function testConnection(Server $server): array
    {
        $payload = $this->request($server, 'GET', '/server');

        return [
            'driver' => 'plesk',
            'label' => 'Plesk',
            'successful' => true,
            'message' => __('provisioning.plesk.connection_successful'),
            'version' => $this->extractVersion($payload),
            'metadata' => $this->summarizeServerPayload($payload),
        ];
    }

    public function subscriptionCommand(Server $server, array $parameters): array
    {
        return $this->request(
            server: $server,
            method: 'POST',
            path: '/cli/subscription/call',
            payload: ['params' => array_values($parameters)],
            operation: 'subscription',
            cliCommand: true,
            safeRequestPayload: ['params' => $this->sanitizeCliParameters($parameters)],
        );
    }

    public function servicePlanCommand(Server $server, array $parameters): array
    {
        return $this->request(
            server: $server,
            method: 'POST',
            path: '/cli/service_plan/call',
            payload: ['params' => array_values($parameters)],
            operation: 'service_plan',
            cliCommand: true,
            safeRequestPayload: ['params' => $this->sanitizeCliParameters($parameters)],
        );
    }

    private function request(
        Server $server,
        string $method,
        string $path,
        array $payload = [],
        string $operation = 'request',
        bool $cliCommand = false,
        ?array $safeRequestPayload = null,
    ): array {
        $config = PleskConnectionConfig::fromServer($server);
        $url = rtrim($config->apiBaseUrl, '/') . '/' . ltrim($path, '/');
        $response = null;
        $exception = null;

        for ($attempt = 1; $attempt <= $config->retryTimes; $attempt++) {
            try {
                $response = $this->pendingRequest($config)
                    ->send($method, $url, $this->requestOptions($method, $payload));
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

        $requestPayload = array_filter([
            'method' => strtoupper($method),
            'path' => $path,
            'payload' => $safeRequestPayload ?? $payload,
        ], static fn (mixed $value): bool => $value !== [] && $value !== null);

        if (! $response) {
            throw new ProvisioningException(
                __('provisioning.plesk.connection_failed'),
                requestPayload: $requestPayload,
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
                __('provisioning.plesk.request_failed', ['operation' => $operation]),
                requestPayload: $requestPayload,
                responsePayload: array_merge($responsePayload, ['http_status' => $response->status()]),
            );
        }

        if (! is_array($body)) {
            throw new ProvisioningException(
                __('provisioning.plesk.invalid_response'),
                requestPayload: $requestPayload,
                responsePayload: $responsePayload,
            );
        }

        if ($cliCommand && ! $this->indicatesCliSuccess($body)) {
            throw new ProvisioningException(
                $this->extractFailureMessage($operation, $body),
                requestPayload: $requestPayload,
                responsePayload: $body,
            );
        }

        return $body;
    }

    private function pendingRequest(PleskConnectionConfig $config): PendingRequest
    {
        $request = Http::acceptJson()
            ->contentType('application/json')
            ->connectTimeout($config->connectTimeout)
            ->timeout($config->timeout)
            ->withBasicAuth($config->username, $config->password);

        if (! $config->verifySsl) {
            $request = $request->withoutVerifying();
        }

        return $request;
    }

    private function requestOptions(string $method, array $payload): array
    {
        if (strtoupper($method) === 'GET') {
            return $payload === [] ? [] : ['query' => $payload];
        }

        return $payload === [] ? [] : ['json' => $payload];
    }

    private function parseInfoResponse(array $response): array
    {
        $info = [];
        $data = Arr::get($response, 'data');

        if (is_array($data)) {
            foreach ($data as $key => $value) {
                if (is_scalar($value) || $value === null) {
                    $info[(string) \Illuminate\Support\Str::snake((string) $key)] = $value;
                }
            }
        }

        $stdout = trim((string) Arr::get($response, 'stdout', ''));

        if ($stdout !== '') {
            foreach (preg_split('/\r\n|\r|\n/', $stdout) ?: [] as $line) {
                if (! preg_match('/^\s*([^:]+):\s*(.+)$/', trim($line), $matches)) {
                    continue;
                }

                $key = \Illuminate\Support\Str::snake((string) \Illuminate\Support\Str::of($matches[1])
                    ->replace(['(', ')', '/'], ' ')
                    ->squish());

                $info[$key] = trim($matches[2]);
            }
        }

        return $info;
    }

    private function indicatesCliSuccess(array $payload): bool
    {
        $code = Arr::get($payload, 'code')
            ?? Arr::get($payload, 'exit_code')
            ?? Arr::get($payload, 'exitCode');

        if ($code !== null) {
            return (int) $code === 0;
        }

        $status = Arr::get($payload, 'status');

        if ($status !== null) {
            return in_array($status, [0, '0', true, 'ok', 'success'], true);
        }

        $error = Arr::get($payload, 'error');

        if ($error !== null && $error !== '') {
            return false;
        }

        $stderr = trim((string) Arr::get($payload, 'stderr', ''));

        return $stderr === '';
    }

    private function extractFailureMessage(string $operation, array $payload): string
    {
        $message = Arr::get($payload, 'stderr')
            ?? Arr::get($payload, 'message')
            ?? Arr::get($payload, 'error')
            ?? Arr::get($payload, 'errors.0.detail')
            ?? Arr::get($payload, 'errors.0');

        return filled($message)
            ? trim((string) $message)
            : __('provisioning.plesk.request_failed', ['operation' => $operation]);
    }

    private function sanitizeCliParameters(array $parameters): array
    {
        $sanitized = [];
        $redactNext = false;

        foreach ($parameters as $parameter) {
            if ($redactNext) {
                $sanitized[] = '[REDACTED]';
                $redactNext = false;
                continue;
            }

            $sanitized[] = $parameter;

            if (in_array((string) $parameter, ['-passwd', '--passwd', '-password', '--password'], true)) {
                $redactNext = true;
            }
        }

        return $sanitized;
    }

    private function extractVersion(array $payload): ?string
    {
        $version = Arr::get($payload, 'version')
            ?? Arr::get($payload, 'information.version')
            ?? Arr::get($payload, 'plesk_version')
            ?? Arr::get($payload, 'panel.version')
            ?? Arr::get($payload, 'meta.version');

        return filled($version) ? (string) $version : null;
    }

    private function summarizeServerPayload(array $payload): array
    {
        return array_filter([
            'hostname' => Arr::get($payload, 'hostname') ?? Arr::get($payload, 'host'),
            'version' => $this->extractVersion($payload),
            'platform' => Arr::get($payload, 'platform') ?? Arr::get($payload, 'os.name'),
            'mode' => Arr::get($payload, 'mode'),
        ], static fn (mixed $value): bool => $value !== null && $value !== '');
    }
}
