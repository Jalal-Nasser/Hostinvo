<?php

namespace App\Jobs\Automation;

use App\Models\WebhookLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class PurgeWebhookLogs implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function __construct()
    {
        $this->onQueue('low');
    }

    public function handle(): void
    {
        WebhookLog::query()
            ->where('created_at', '<', now()->subDays(90))
            ->delete();
    }
}
