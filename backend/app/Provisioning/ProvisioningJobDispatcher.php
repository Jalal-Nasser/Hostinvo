<?php

namespace App\Provisioning;

use App\Jobs\Provisioning\ProcessProvisioningJob;
use App\Models\ProvisioningJob;

class ProvisioningJobDispatcher
{
    public function dispatch(ProvisioningJob $job): void
    {
        ProcessProvisioningJob::dispatch($job->getKey())
            ->onQueue($job->queue_name ?: config('provisioning.queue.name', 'critical'));
    }
}
