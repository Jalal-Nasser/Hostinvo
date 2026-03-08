<?php

namespace App\Provisioning\DTOs;

readonly class UsageData
{
    public function __construct(
        public int $diskUsedMb,
        public ?int $diskLimitMb,
        public int $bandwidthUsedMb,
        public ?int $bandwidthLimitMb,
        public int $inodesUsed = 0,
        public int $emailAccountsUsed = 0,
        public int $databasesUsed = 0,
        public string $serviceStatus = 'active',
        public ?string $suspendReason = null,
        public ?string $packageName = null,
        public ?string $rawResponse = null,
    ) {
    }
}
