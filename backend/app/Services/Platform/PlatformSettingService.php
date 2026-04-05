<?php

namespace App\Services\Platform;

use App\Models\PlatformSetting;
use Illuminate\Support\Facades\Crypt;
use JsonException;

class PlatformSettingService
{
    public function get(string $key, mixed $default = null): mixed
    {
        $setting = PlatformSetting::query()->where('key', $key)->first();

        if (! $setting) {
            return $default;
        }

        return $this->decode($setting->value, $setting->is_encrypted, $default);
    }

    public function put(string $key, mixed $value, bool $encrypted = false): PlatformSetting
    {
        return PlatformSetting::query()->updateOrCreate(
            ['key' => $key],
            [
                'value' => $encrypted ? Crypt::encryptString($this->encode($value)) : $this->encode($value),
                'is_encrypted' => $encrypted,
            ],
        );
    }

    private function encode(mixed $value): string
    {
        try {
            return json_encode($value, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return json_encode((string) $value);
        }
    }

    private function decode(mixed $value, bool $encrypted, mixed $default): mixed
    {
        if ($value === null) {
            return $default;
        }

        $payload = $encrypted ? Crypt::decryptString((string) $value) : (string) $value;

        try {
            return json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return $default;
        }
    }
}
