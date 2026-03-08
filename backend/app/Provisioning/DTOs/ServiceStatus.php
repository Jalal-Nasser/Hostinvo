<?php

namespace App\Provisioning\DTOs;

readonly class ServiceStatus
{
    public function __construct(
        public string $status,
        public ?string $suspendReason = null,
        public ?string $packageName = null,
        public ?string $rawResponse = null,
    ) {
    }
}
