<?php

namespace App\Services\Notifications;

use App\Mail\TemplatedMail;
use App\Models\EmailLog;
use App\Models\Tenant;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class NotificationDispatchService
{
    public function __construct(
        private readonly NotificationTemplateService $templates,
    ) {
    }

    public function send(
        string $email,
        string $event,
        array $context,
        ?Tenant $tenant = null,
        string $locale = 'en',
    ): bool {
        $resolved = $this->templates->render($event, $locale, $context, $tenant);

        if (! $resolved['is_enabled']) {
            return false;
        }

        try {
            Mail::to($email)->send(new TemplatedMail(
                subjectLine: $resolved['subject'],
                bodyHtml: $resolved['body_html'],
                bodyText: $resolved['body_text'],
                locale: $locale,
            ));

            EmailLog::query()->create([
                'tenant_id' => $tenant?->getKey(),
                'to_email' => $email,
                'subject' => $resolved['subject'],
                'event' => $event,
                'status' => 'sent',
                'error_message' => null,
                'sent_at' => now(),
                'created_at' => now(),
            ]);

            return true;
        } catch (Throwable $throwable) {
            Log::error('[NotificationDispatchService] Failed to send template email.', [
                'event' => $event,
                'email' => $email,
                'tenant_id' => $tenant?->getKey(),
                'message' => $throwable->getMessage(),
            ]);

            EmailLog::query()->create([
                'tenant_id' => $tenant?->getKey(),
                'to_email' => $email,
                'subject' => $resolved['subject'],
                'event' => $event,
                'status' => 'failed',
                'error_message' => $throwable->getMessage(),
                'sent_at' => null,
                'created_at' => now(),
            ]);

            return false;
        }
    }
}
