<?php

namespace App\Payments\DataTransferObjects;

class GatewayConfiguration
{
    public function __construct(
        public readonly string $code,
        public readonly string $label,
        public readonly string $description,
        public readonly bool $enabled,
        public readonly array $credentials,
        public readonly array $options,
        public readonly array $required,
    ) {
    }

    public function credential(string $key): ?string
    {
        $value = $this->credentials[$key] ?? null;

        return is_string($value) && $value !== '' ? $value : null;
    }

    public function option(string $key, mixed $default = null): mixed
    {
        return $this->options[$key] ?? $default;
    }

    public function usable(): bool
    {
        if (! $this->enabled) {
            return false;
        }

        foreach ($this->required as $key) {
            if ($this->credential($key) === null) {
                return false;
            }
        }

        return true;
    }

    public function toArray(): array
    {
        return [
            'code' => $this->code,
            'label' => $this->label,
            'description' => $this->description,
            'enabled' => $this->enabled,
            'usable' => $this->usable(),
        ];
    }
}
