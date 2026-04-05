<?php

namespace App\Services\Platform;

use App\Models\PlatformSetting;

class PlatformSettingService
{
    /**
     * @return array<string, mixed>
     */
    public function get(string $key, array $default = []): array
    {
        $setting = PlatformSetting::query()->where('key', $key)->first();

        if (! $setting) {
            return $default;
        }

        return is_array($setting->value) ? $setting->value : $default;
    }

    /**
     * @param  array<string, mixed>  $value
     */
    public function put(string $key, array $value): PlatformSetting
    {
        return PlatformSetting::query()->updateOrCreate(
            ['key' => $key],
            ['value' => $value],
        );
    }
}
