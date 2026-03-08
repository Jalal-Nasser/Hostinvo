<?php

namespace App\Provisioning\Data;

use App\Models\ProvisioningJob;
use App\Models\Server;
use App\Models\ServerPackage;
use App\Models\Service;

readonly class ProvisioningContext
{
    public function __construct(
        public Service $service,
        public Server $server,
        public ?ServerPackage $serverPackage = null,
        public ?ProvisioningJob $job = null,
        public array $payload = [],
    ) {
    }
}
