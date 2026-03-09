<?php

namespace App\Provisioning;

use App\Jobs\Provisioning\ProvisionAccountJob;
use App\Jobs\Provisioning\ProcessProvisioningJob;
use App\Models\ProvisioningJob;

class ProvisioningJobDispatcher
{
    public function dispatch(ProvisioningJob $job): void
    {
        if ($job->operation === ProvisioningJob::OPERATION_CREATE_ACCOUNT) {
            ProvisionAccountJob::dispatch($job->service_id)
                ->onQueue($job->queue_name ?: config('provisioning.queue.name', 'critical'));

            return;
        }

        ProcessProvisioningJob::dispatch($job->getKey())
            ->onQueue($job->queue_name ?: config('provisioning.queue.name', 'critical'));
    }
}
