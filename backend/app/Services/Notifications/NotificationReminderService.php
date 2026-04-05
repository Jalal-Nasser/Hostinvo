<?php

namespace App\Services\Notifications;

use App\Models\EmailLog;
use App\Models\Invoice;
use App\Models\License;
use App\Models\Tenant;

class NotificationReminderService
{
    public function __construct(
        private readonly NotificationDispatchService $notifications,
    ) {
    }

    public function sendPaymentReminders(): int
    {
        $sent = 0;

        Invoice::query()
            ->withoutGlobalScopes()
            ->with(['client'])
            ->whereIn('status', [Invoice::STATUS_UNPAID, Invoice::STATUS_OVERDUE])
            ->where('balance_due_minor', '>', 0)
            ->whereDate('due_date', '<=', now()->addDays(3)->toDateString())
            ->orderBy('due_date')
            ->chunkById(100, function ($invoices) use (&$sent): void {
                foreach ($invoices as $invoice) {
                    $client = $invoice->client;

                    if (! $client || ! filled($client->email) || $this->recentlySent($invoice->tenant_id, NotificationEventCatalog::EVENT_PAYMENT_REMINDER, $client->email)) {
                        continue;
                    }

                    $tenant = Tenant::query()->withoutGlobalScopes()->find($invoice->tenant_id);

                    if (! $tenant) {
                        continue;
                    }

                    $wasSent = $this->notifications->send(
                        email: $client->email,
                        event: NotificationEventCatalog::EVENT_PAYMENT_REMINDER,
                        context: [
                            'client' => [
                                'name' => $client->display_name,
                                'email' => $client->email,
                            ],
                            'invoice' => [
                                'reference_number' => $invoice->reference_number,
                                'total' => number_format($invoice->total_minor / 100, 2).' '.$invoice->currency,
                                'due_date' => $invoice->due_date?->toDateString(),
                            ],
                        ],
                        tenant: $tenant,
                        locale: $client->preferred_locale ?: $tenant->default_locale,
                    );

                    if ($wasSent) {
                        $sent++;
                    }
                }
            }, 'id');

        return $sent;
    }

    public function sendTrialExpiryReminders(): int
    {
        $sent = 0;

        License::query()
            ->withoutGlobalScopes()
            ->with(['tenant.owner'])
            ->where('type', License::PLAN_FREE_TRIAL)
            ->where('status', License::STATUS_ACTIVE)
            ->whereNotNull('expires_at')
            ->whereBetween('expires_at', [now(), now()->addDays(3)])
            ->orderBy('expires_at')
            ->chunkById(100, function ($licenses) use (&$sent): void {
                foreach ($licenses as $license) {
                    $tenant = $license->tenant;
                    $owner = $tenant?->owner;

                    if (! $tenant || ! $owner || ! filled($owner->email) || $this->recentlySent($tenant->id, NotificationEventCatalog::EVENT_TRIAL_EXPIRY_REMINDER, $owner->email)) {
                        continue;
                    }

                    $wasSent = $this->notifications->send(
                        email: $owner->email,
                        event: NotificationEventCatalog::EVENT_TRIAL_EXPIRY_REMINDER,
                        context: [
                            'user' => [
                                'name' => $owner->name,
                                'email' => $owner->email,
                            ],
                            'tenant' => [
                                'name' => $tenant->name,
                            ],
                            'license' => [
                                'expires_at' => $license->expires_at?->toDateString(),
                            ],
                        ],
                        tenant: $tenant,
                        locale: $tenant->default_locale,
                    );

                    if ($wasSent) {
                        $sent++;
                    }
                }
            }, 'id');

        return $sent;
    }

    private function recentlySent(?string $tenantId, string $event, string $email): bool
    {
        if (! $tenantId) {
            return false;
        }

        return EmailLog::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('event', $event)
            ->where('to_email', $email)
            ->where('status', 'sent')
            ->where('created_at', '>=', now()->subDay())
            ->exists();
    }
}
