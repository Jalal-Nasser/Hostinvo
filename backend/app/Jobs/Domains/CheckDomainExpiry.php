<?php

namespace App\Jobs\Domains;

use App\Models\Domain;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Scheduled daily at 01:00 UTC (registered in routes/console.php).
 *
 * Queries all active domains expiring in exactly 60, 30, 14, or 7 days
 * and triggers an expiry reminder for each one. When the notification
 * infrastructure (Phase 15) is in place, replace the Log placeholder
 * with a call to NotificationService or fire a DomainExpiryReminderEvent.
 */
class CheckDomainExpiry implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Days before expiry at which reminder notifications are dispatched. */
    private const REMINDER_DAYS = [60, 30, 14, 7];

    public int $tries = 2;

    public function __construct()
    {
        $this->onQueue('default');
    }

    public function handle(): void
    {
        foreach (self::REMINDER_DAYS as $days) {
            $targetDate = Carbon::today()->addDays($days)->toDateString();

            Domain::query()
                ->with(['client'])
                ->where('status', 'active')
                ->whereDate('expiry_date', $targetDate)
                ->cursor()
                ->each(fn (Domain $domain) => $this->sendReminder($domain, $days));
        }
    }

    private function sendReminder(Domain $domain, int $daysUntilExpiry): void
    {
        try {
            // Resolve the client's preferred locale for a localised reminder.
            $locale = $domain->client?->locale ?? 'en';

            // ---------------------------------------------------------------
            // TODO (Phase 15): Replace this log statement with a real
            // notification once NotificationService and bilingual email
            // templates are in place. Example:
            //
            //   app(NotificationService::class)->send(
            //       'domain.expiry_reminder',
            //       $domain->client,
            //       ['domain' => $domain, 'days' => $daysUntilExpiry],
            //   );
            //
            // Or fire an event that a Listener handles:
            //   event(new DomainExpiryReminderEvent($domain, $daysUntilExpiry));
            // ---------------------------------------------------------------

            Log::info('[CheckDomainExpiry] Expiry reminder triggered', [
                'tenant_id'         => $domain->tenant_id,
                'domain_id'         => $domain->id,
                'domain'            => $domain->domain,
                'expiry_date'       => $domain->expiry_date?->toDateString(),
                'days_until_expiry' => $daysUntilExpiry,
                'client_id'         => $domain->client_id,
                'locale'            => $locale,
            ]);

        } catch (\Throwable $e) {
            // Never let a single failure abort the full batch.
            Log::error('[CheckDomainExpiry] Failed to send reminder', [
                'domain_id' => $domain->id,
                'error'     => $e->getMessage(),
            ]);
        }
    }
}
