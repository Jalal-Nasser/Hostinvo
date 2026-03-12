<?php

namespace App\Services\Tenancy;

use App\Models\Tenant;
use App\Models\TenantSetting;
use App\Support\Cache\TenantCache;
use Illuminate\Support\Facades\Crypt;
use JsonException;

class TenantSettingService
{
    public function __construct(
        private readonly TenantCache $cache,
    ) {
    }

    public function get(Tenant $tenant, string $key, mixed $default = null): mixed
    {
        return $this->cache->remember(
            $tenant->id,
            'settings',
            $key,
            $this->cacheTtl(),
            function () use ($tenant, $key, $default): mixed {
                $setting = TenantSetting::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('key', $key)
                    ->first();

                if (! $setting) {
                    return $default;
                }

                return $this->decode($setting->value, $setting->is_encrypted);
            }
        );
    }

    public function put(
        Tenant $tenant,
        string $key,
        mixed $value,
        bool $encrypted = false,
        array $metadata = []
    ): TenantSetting {
        $encoded = $this->encode($value);
        $setting = TenantSetting::query()
            ->where('tenant_id', $tenant->id)
            ->where('key', $key)
            ->first() ?? new TenantSetting();

        $setting->tenant_id = $tenant->id;
        $setting->key = $key;
        $setting->value = $encrypted ? Crypt::encryptString($encoded) : $encoded;
        $setting->is_encrypted = $encrypted;
        $setting->save();
        $this->cache->forget($tenant->id, 'settings', $key);

        return $setting;
    }

    public function getMany(Tenant $tenant, array $keys): array
    {
        return collect($keys)
            ->filter(fn (mixed $key): bool => is_string($key) && filled($key))
            ->unique()
            ->mapWithKeys(fn (string $key): array => [$key => $this->get($tenant, $key)])
            ->all();
    }

    private function encode(mixed $value): string
    {
        try {
            return json_encode($value, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return json_encode((string) $value);
        }
    }

    private function decode(?string $value, bool $encrypted): mixed
    {
        if ($value === null) {
            return null;
        }

        $payload = $encrypted ? Crypt::decryptString($value) : $value;

        try {
            return json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return $payload;
        }
    }

    private function cacheTtl(): int
    {
        return max(60, (int) config('hostinvo.performance.cache.tenant_settings_ttl_seconds', 300));
    }
}
