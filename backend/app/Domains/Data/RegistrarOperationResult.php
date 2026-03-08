<?php

namespace App\Domains\Data;

class RegistrarOperationResult
{
    public function __construct(
        public readonly bool $successful,
        public readonly string $status,
        public readonly ?string $message = null,
        public readonly ?array $payload = null,
    ) {
    }
}
