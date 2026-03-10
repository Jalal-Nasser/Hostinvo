<?php

namespace Tests\Fixtures\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use RuntimeException;

class FailingTenantAwareJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $reason = 'Intentional test failure',
    ) {
        $this->onQueue('default');
    }

    public function handle(): void
    {
        throw new RuntimeException($this->reason);
    }
}
