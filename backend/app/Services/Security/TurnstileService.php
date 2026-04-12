<?php

namespace App\Services\Security;

use App\Models\Tenant;
use App\Services\Platform\PlatformSettingService;
use App\Services\Tenancy\TenantSettingService;
use App\Support\Tenancy\RequestTenantResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;

class TurnstileService
{
    public const PLATFORM_KEY = 'security.turnstile';
    public const TENANT_KEY = 'security.turnstile';

    public function __construct(
        private readonly PlatformSettingService $platformSettings,
        private readonly TenantSettingService $tenantSettings,
        private readonly RequestTenantResolver $requestTenantResolver,
    ) {
    }

    public function publicConfig(Request $request): array
    {
        $config = $this->resolveConfigForRequest($request);

        return [
            'enabled' => (bool) ($config['enabled'] ?? false),
            'site_key' => (string) ($config['site_key'] ?? ''),
            'forms' => $this->expandFormAliases((array) ($config['forms'] ?? [])),
        ];
    }

    public function platformConfig(): array
    {
        return $this->normalizePlatformConfig(
            $this->platformSettings->get(
                self::PLATFORM_KEY,
                config('security.turnstile.platform_defaults', []),
            )
        );
    }

    public function tenantConfig(Tenant $tenant): array
    {
        return $this->normalizeTenantConfig(
            $this->tenantSettings->get(
                $tenant,
                self::TENANT_KEY,
                config('security.turnstile.tenant_defaults', []),
            )
        );
    }

    public function updatePlatformConfig(array $payload): array
    {
        $config = $this->normalizePlatformConfig($payload);
        $this->platformSettings->put(self::PLATFORM_KEY, $config, true);

        return $config;
    }

    public function updateTenantConfig(Tenant $tenant, array $payload): array
    {
        $config = $this->normalizeTenantConfig($payload);
        $this->tenantSettings->put($tenant, self::TENANT_KEY, $config, true);

        return $config;
    }

    public function verifyRequest(Request $request, string $form): bool
    {
        $config = $this->resolveConfigForRequest($request);

        if (! $this->isEnabledForForm($config, $form)) {
            return true;
        }

        $token = (string) $request->input('turnstile_token', '');

        if ($token === '') {
            return false;
        }

        $response = Http::asForm()
            ->timeout((int) config('security.turnstile.timeout_seconds', 5))
            ->post((string) config('security.turnstile.verify_url'), [
                'secret' => (string) ($config['secret_key'] ?? ''),
                'response' => $token,
                'remoteip' => $request->ip(),
            ]);

        if (! $response->ok()) {
            return false;
        }

        return (bool) $response->json('success', false);
    }

    private function resolveConfigForRequest(Request $request): array
    {
        $tenant = $this->requestTenantResolver->resolveFromRequest($request);

        if (! $tenant && $request->user()?->tenant instanceof Tenant) {
            $tenant = $request->user()->tenant;
        }

        if ($tenant) {
            $tenantConfig = $this->tenantConfig($tenant);

            if (($tenantConfig['enabled'] ?? false) && ($tenantConfig['use_custom_keys'] ?? false)) {
                return $tenantConfig;
            }
        }

        return $this->platformConfig();
    }

    private function isEnabledForForm(array $config, string $form): bool
    {
        $forms = $this->expandFormAliases((array) ($config['forms'] ?? []));

        return (bool) ($config['enabled'] ?? false)
            && filled($config['site_key'] ?? null)
            && filled($config['secret_key'] ?? null)
            && (bool) Arr::get($forms, $form, false);
    }

    private function expandFormAliases(array $forms): array
    {
        return array_merge($forms, [
            'login' => (bool) ($forms['login'] ?? $forms['client_login'] ?? false),
            'forgot_password' => (bool) ($forms['forgot_password'] ?? $forms['portal_forgot_password'] ?? false),
            'reset_password' => (bool) ($forms['reset_password'] ?? $forms['portal_reset_password'] ?? false),
        ]);
    }

    private function normalizePlatformConfig(mixed $payload): array
    {
        $defaults = (array) config('security.turnstile.platform_defaults', []);
        $payload = (array) $payload;

        return [
            'enabled' => (bool) Arr::get($payload, 'enabled', $defaults['enabled'] ?? false),
            'site_key' => trim((string) Arr::get($payload, 'site_key', $defaults['site_key'] ?? '')),
            'secret_key' => trim((string) Arr::get($payload, 'secret_key', $defaults['secret_key'] ?? '')),
            'forms' => collect(array_replace($defaults['forms'] ?? [], Arr::get($payload, 'forms', [])))
                ->map(fn (mixed $value): bool => (bool) $value)
                ->all(),
        ];
    }

    private function normalizeTenantConfig(mixed $payload): array
    {
        $defaults = (array) config('security.turnstile.tenant_defaults', []);
        $payload = (array) $payload;

        return [
            'enabled' => (bool) Arr::get($payload, 'enabled', $defaults['enabled'] ?? false),
            'use_custom_keys' => (bool) Arr::get($payload, 'use_custom_keys', $defaults['use_custom_keys'] ?? false),
            'site_key' => trim((string) Arr::get($payload, 'site_key', $defaults['site_key'] ?? '')),
            'secret_key' => trim((string) Arr::get($payload, 'secret_key', $defaults['secret_key'] ?? '')),
            'forms' => collect(array_replace($defaults['forms'] ?? [], Arr::get($payload, 'forms', [])))
                ->map(fn (mixed $value): bool => (bool) $value)
                ->all(),
        ];
    }
}
