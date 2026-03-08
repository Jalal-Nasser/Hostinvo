<?php

namespace App\Provisioning\DTOs;

readonly class ProvisionResult
{
    public function __construct(
        public bool $success,
        public string $username,
        public ?string $ip = null,
        public ?string $nameserver1 = null,
        public ?string $nameserver2 = null,
        public ?string $rawResponse = null,
    ) {
    }
}
