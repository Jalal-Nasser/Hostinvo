<?php

namespace App\Jobs\Provisioning;

use App\Services\Provisioning\ProvisioningService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Throwable;

class ProvisionAccountJob implements ShouldQueue
{
    use InteractsWithQueue;
    use Queueable;

    public int $tries = 3;

    public function __construct(public readonly string $serviceId)
    {
        $this->onQueue(config('provisioning.queue.name', 'critical'));
        $this->tries = (int) config('provisioning.queue.tries', 3);
    }

    public function handle(ProvisioningService $provisioningService): void
    {
        $provisioningService->processCreateAccountForService(
            $this->serviceId,
            $this->job?->attempts() ?? 1,
        );
    }

    public function backoff(): array
    {
        return config('provisioning.queue.backoff', [60, 300, 900]);
    }

    public function failed(Throwable $exception): void
    {
        app(ProvisioningService::class)->markCreateAccountFailedForService(
            $this->serviceId,
            $exception->getMessage(),
            shouldThrow: false,
        );
    }
}
