<?php

use App\Jobs\Automation\PurgeWebhookLogs;
use App\Jobs\Domains\CheckDomainExpiry;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

/*
|--------------------------------------------------------------------------
| Scheduled Tasks
|--------------------------------------------------------------------------
|
| All recurring automation tasks are registered below. The scheduler
| container runs `artisan schedule:run` every minute (see docker-compose).
| Queue tiers match the architecture spec: critical > default > low.
|
*/

// Phase 14 — Domain Management
// Checks for domains expiring in 60, 30, 14, or 7 days and sends reminders.
Schedule::job(new CheckDomainExpiry, 'default')->dailyAt('01:00');
Schedule::job(new PurgeWebhookLogs, 'low')->dailyAt('04:30');
