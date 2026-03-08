<?php

namespace App\Provisioning\Support;

use Illuminate\Support\Str;

class SensitivePayloadSanitizer
{
    private const REDACTED = '[REDACTED]';

    public function sanitizeArray(array $payload): array
    {
        return $this->sanitizeValue($payload);
    }

    public function sanitizeValue(mixed $value, string|int|null $key = null): mixed
    {
        if ($this->isSensitiveKey($key)) {
            return self::REDACTED;
        }

        if (is_array($value)) {
            $sanitized = [];

            foreach ($value as $nestedKey => $nestedValue) {
                $sanitized[$nestedKey] = $this->sanitizeValue($nestedValue, $nestedKey);
            }

            return $sanitized;
        }

        if (is_string($value) && strlen($value) > 4000) {
            return Str::limit($value, 4000, '...');
        }

        return $value;
    }

    private function isSensitiveKey(string|int|null $key): bool
    {
        if (! is_string($key) || $key === '') {
            return false;
        }

        $normalized = Str::of($key)
            ->lower()
            ->replace(['-', ' '], '_')
            ->value();

        foreach ([
            'password',
            'passwd',
            'secret',
            'token',
            'authorization',
            'api_key',
            'apikey',
            'api_secret',
            'api_token',
            'access_hash',
            'credentials',
            'x_api_key',
            'x_auth_token',
        ] as $needle) {
            if (str_contains($normalized, $needle)) {
                return true;
            }
        }

        return false;
    }
}
