<?php

namespace App\Services\Notifications;

class NotificationEventCatalog
{
    public const SCOPE_PLATFORM = 'platform';
    public const SCOPE_TENANT = 'tenant';

    public const EVENT_FREE_TRIAL_WELCOME = 'free_trial_welcome';
    public const EVENT_ACCOUNT_EMAIL_VERIFICATION = 'account_email_verification';
    public const EVENT_ORDER_PLACED = 'order_placed';
    public const EVENT_INVOICE_CREATED = 'invoice_created';
    public const EVENT_PAYMENT_REMINDER = 'payment_reminder';
    public const EVENT_PAYMENT_RECEIPT = 'payment_receipt';
    public const EVENT_TRIAL_EXPIRY_REMINDER = 'trial_expiry_reminder';
    public const EVENT_TENANT_SUSPENDED = 'tenant_suspended';
    public const EVENT_TENANT_REACTIVATED = 'tenant_reactivated';

    public static function definitions(): array
    {
        return [
            self::EVENT_FREE_TRIAL_WELCOME => ['scope' => self::SCOPE_PLATFORM],
            self::EVENT_ACCOUNT_EMAIL_VERIFICATION => ['scope' => self::SCOPE_PLATFORM],
            self::EVENT_TRIAL_EXPIRY_REMINDER => ['scope' => self::SCOPE_PLATFORM],
            self::EVENT_TENANT_SUSPENDED => ['scope' => self::SCOPE_PLATFORM],
            self::EVENT_TENANT_REACTIVATED => ['scope' => self::SCOPE_PLATFORM],
            self::EVENT_ORDER_PLACED => ['scope' => self::SCOPE_TENANT],
            self::EVENT_INVOICE_CREATED => ['scope' => self::SCOPE_TENANT],
            self::EVENT_PAYMENT_REMINDER => ['scope' => self::SCOPE_TENANT],
            self::EVENT_PAYMENT_RECEIPT => ['scope' => self::SCOPE_TENANT],
        ];
    }

    public static function scopeFor(string $event): string
    {
        return self::definitions()[$event]['scope'] ?? self::SCOPE_TENANT;
    }
}
