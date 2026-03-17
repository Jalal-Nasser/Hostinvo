<?php

namespace App\Services\Licensing\Data;

readonly class LicenseVerificationResult
{
    public const STATUS_VERIFIED = 'verified';
    public const STATUS_INVALID = 'invalid';
    public const STATUS_UNAVAILABLE = 'unavailable';
    public const STATUS_SKIPPED = 'skipped';

    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public string $status,
        public ?string $message = null,
        public array $payload = [],
    ) {
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function verified(array $payload = [], ?string $message = null): self
    {
        return new self(self::STATUS_VERIFIED, $message, $payload);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function invalid(?string $message = null, array $payload = []): self
    {
        return new self(self::STATUS_INVALID, $message, $payload);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function unavailable(?string $message = null, array $payload = []): self
    {
        return new self(self::STATUS_UNAVAILABLE, $message, $payload);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function skipped(?string $message = null, array $payload = []): self
    {
        return new self(self::STATUS_SKIPPED, $message, $payload);
    }
}
