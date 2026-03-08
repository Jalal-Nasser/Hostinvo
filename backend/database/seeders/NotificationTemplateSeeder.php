<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\App;

class NotificationTemplateSeeder extends Seeder
{
    /**
     * Seed default notification templates for both supported locales.
     *
     * These are system-level defaults (tenant_id = null workaround:
     * since tenant_id is a non-nullable FK, we use the first tenant
     * found or skip gracefully when no tenant exists).
     *
     * In production, each tenant would have their own per-locale records.
     * This seeder creates one representative set in the first tenant for
     * testing and demo purposes.
     */
    public function run(): void
    {
        // Load the notification strings from the lang files.
        $events = ['invoice_created', 'invoice_overdue', 'payment_received', 'ticket_reply', 'provisioning_failed'];
        $locales = ['en', 'ar'];

        // Find the first tenant ID to use as a reference.
        $tenantId = DB::table('tenants')->value('id');

        if (!$tenantId) {
            $this->command->warn('NotificationTemplateSeeder: No tenants found. Skipping.');
            return;
        }

        foreach ($events as $event) {
            foreach ($locales as $locale) {
                App::setLocale($locale);
                $strings = trans("notifications.{$event}");

                if (!is_array($strings)) {
                    $this->command->warn("Missing notification strings for event [{$event}] locale [{$locale}]. Skipping.");
                    continue;
                }

                DB::table('notification_templates')->updateOrInsert(
                    [
                        'tenant_id' => $tenantId,
                        'event'     => $event,
                        'locale'    => $locale,
                    ],
                    [
                        'subject'    => $strings['subject'] ?? '',
                        'body_html'  => $this->buildHtmlBody($strings),
                        'body_text'  => $this->buildTextBody($strings),
                        'is_enabled' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }

        App::setLocale(config('app.locale', 'en'));

        $this->command->info('NotificationTemplateSeeder: seeded ' . (count($events) * count($locales)) . ' templates (' . implode(', ', $locales) . ').');
    }

    private function buildHtmlBody(array $strings): string
    {
        $greeting = e($strings['greeting'] ?? '');
        $body     = e($strings['body'] ?? '');
        $cta      = e($strings['cta'] ?? '');
        $footer   = e($strings['footer'] ?? '');

        return <<<HTML
            <p>{$greeting}</p>
            <p>{$body}</p>
            <p><a href="{{url}}">{$cta}</a></p>
            <p style="color:#888;font-size:12px;">{$footer}</p>
            HTML;
    }

    private function buildTextBody(array $strings): string
    {
        return implode("\n\n", array_filter([
            $strings['greeting'] ?? '',
            $strings['body'] ?? '',
            $strings['cta'] ?? '',
            $strings['footer'] ?? '',
        ]));
    }
}
