<?php

namespace App\Services\Tenancy;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Arr;

class TenantMfaPolicyService
{
    public const KEY = 'security.mfa_policy';
    public const DISABLED = 'disabled';
    public const OPTIONAL = 'optional';
    public const REQUIRED = 'required';

    public function __construct(
        private readonly TenantSettingService $tenantSettings,
    ) {
    }

    public function tenantConfig(Tenant $tenant): array
    {
        return $this->normalize(
            $this->tenantSettings->get(
                $tenant,
                self::KEY,
                config('security.mfa.tenant_policy_defaults', []),
            )
        );
    }

    public function updateTenantConfig(Tenant $tenant, array $payload): array
    {
        $config = $this->normalize($payload);
        $this->tenantSettings->put($tenant, self::KEY, $config, false);

        return $config;
    }

    public function modeForUser(User $user): string
    {
        if (! $user->tenant) {
            return self::DISABLED;
        }

        $config = $this->tenantConfig($user->tenant);

        return match (true) {
            $user->hasRole(Role::CLIENT_USER) => (string) ($config['clients'] ?? self::DISABLED),
            $user->hasRole([Role::TENANT_OWNER, Role::TENANT_ADMIN]) || $user->hasPermissionTo('tenant.manage') => (string) ($config['owner_admin'] ?? self::DISABLED),
            default => (string) ($config['staff'] ?? self::DISABLED),
        };
    }

    private function normalize(mixed $payload): array
    {
        $defaults = (array) config('security.mfa.tenant_policy_defaults', []);
        $payload = (array) $payload;

        return [
            'owner_admin' => $this->normalizeMode(Arr::get($payload, 'owner_admin', $defaults['owner_admin'] ?? self::DISABLED)),
            'staff' => $this->normalizeMode(Arr::get($payload, 'staff', $defaults['staff'] ?? self::DISABLED)),
            'clients' => $this->normalizeMode(Arr::get($payload, 'clients', $defaults['clients'] ?? self::DISABLED)),
        ];
    }

    private function normalizeMode(mixed $value): string
    {
        $mode = strtolower(trim((string) $value));

        return in_array($mode, [self::DISABLED, self::OPTIONAL, self::REQUIRED], true)
            ? $mode
            : self::DISABLED;
    }
}
