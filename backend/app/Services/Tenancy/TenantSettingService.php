<?php

namespace App\Services\Tenancy;

use App\Models\Tenant;
use App\Models\TenantSetting;
use Illuminate\Support\Facades\Crypt;
use JsonException;

class TenantSettingService
{
    public function get(Tenant $tenant, string $key, mixed $default = null): mixed
    {
        $setting = TenantSetting::query()
            ->where('tenant_id', $tenant->id)
            ->where('key', $key)
            ->first();

        if (! $setting) {
            return $default;
        }

        return $this->decode($setting->value, $setting->is_encrypted);
    }

    public function put(
        Tenant $tenant,
        string $key,
        mixed $value,
        bool $encrypted = false,
        array $metadata = []
    ): TenantSetting {
        $encoded = $this->encode($value);

        return TenantSetting::query()->updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'key' => $key,
            ],
            [
                'value' => $encrypted ? Crypt::encryptString($encoded) : $encoded,
                'is_encrypted' => $encrypted,
            ],
        );
    }

    public function getMany(Tenant $tenant, array $keys): array
    {
        return TenantSetting::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('key', $keys)
            ->get()
            ->mapWithKeys(fn (TenantSetting $setting) => [
                $setting->key => $this->decode($setting->value, $setting->is_encrypted),
            ])
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
}
