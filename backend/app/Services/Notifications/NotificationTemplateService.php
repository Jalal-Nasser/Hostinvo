<?php

namespace App\Services\Notifications;

use App\Models\NotificationTemplate;
use App\Models\Tenant;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class NotificationTemplateService
{
    public function templatesForScope(?Tenant $tenant, string $scope): Collection
    {
        $this->ensureDefaults($tenant, $scope);

        return NotificationTemplate::query()
            ->withoutGlobalScopes()
            ->where('scope', $scope)
            ->when(
                $scope === NotificationEventCatalog::SCOPE_PLATFORM,
                fn ($query) => $query->whereNull('tenant_id'),
                fn ($query) => $query->where('tenant_id', $tenant?->getKey()),
            )
            ->orderBy('event')
            ->orderBy('locale')
            ->get();
    }

    public function updateTemplate(?Tenant $tenant, string $scope, string $event, string $locale, array $attributes): NotificationTemplate
    {
        $this->ensureDefaults($tenant, $scope);

        $template = NotificationTemplate::query()
            ->withoutGlobalScopes()
            ->where('scope', $scope)
            ->where('event', $event)
            ->where('locale', $locale)
            ->when(
                $scope === NotificationEventCatalog::SCOPE_PLATFORM,
                fn ($query) => $query->whereNull('tenant_id'),
                fn ($query) => $query->where('tenant_id', $tenant?->getKey()),
            )
            ->firstOrFail();

        $template->fill([
            'subject' => $attributes['subject'],
            'body_html' => $attributes['body_html'],
            'body_text' => $attributes['body_text'] ?? null,
            'is_enabled' => (bool) ($attributes['is_enabled'] ?? true),
        ])->save();

        return $template->fresh();
    }

    public function render(string $event, string $locale, array $context, ?Tenant $tenant = null): array
    {
        $scope = NotificationEventCatalog::scopeFor($event);
        $template = $this->resolveTemplate($tenant, $scope, $event, $locale)
            ?? $this->resolveTemplate($tenant, $scope, $event, 'en');

        if (! $template) {
            $defaults = $this->defaultTemplates()[$event][$locale] ?? $this->defaultTemplates()[$event]['en'];

            return $this->interpolateTemplate($defaults, $context);
        }

        return $this->interpolateTemplate([
            'subject' => $template->subject,
            'body_html' => $template->body_html,
            'body_text' => $template->body_text,
            'is_enabled' => $template->is_enabled,
        ], $context);
    }

    public function ensureDefaults(?Tenant $tenant = null, ?string $scope = null): void
    {
        foreach ($this->defaultTemplates() as $event => $localizedTemplates) {
            $eventScope = NotificationEventCatalog::scopeFor($event);

            if ($scope !== null && $scope !== $eventScope) {
                continue;
            }

            foreach ($localizedTemplates as $locale => $template) {
                NotificationTemplate::query()
                    ->withoutGlobalScopes()
                    ->updateOrCreate(
                        [
                            'tenant_id' => $eventScope === NotificationEventCatalog::SCOPE_PLATFORM ? null : $tenant?->getKey(),
                            'scope' => $eventScope,
                            'event' => $event,
                            'locale' => $locale,
                        ],
                        Arr::only($template, ['subject', 'body_html', 'body_text', 'is_enabled']),
                    );
            }
        }
    }

    private function resolveTemplate(?Tenant $tenant, string $scope, string $event, string $locale): ?NotificationTemplate
    {
        return NotificationTemplate::query()
            ->withoutGlobalScopes()
            ->where('scope', $scope)
            ->where('event', $event)
            ->where('locale', $locale)
            ->when(
                $scope === NotificationEventCatalog::SCOPE_PLATFORM,
                fn ($query) => $query->whereNull('tenant_id'),
                fn ($query) => $query->where('tenant_id', $tenant?->getKey()),
            )
            ->first();
    }

    private function interpolateTemplate(array $template, array $context): array
    {
        $replacements = $this->buildReplacements($context);
        $subject = $this->normalizeEncodedPlaceholders((string) ($template['subject'] ?? ''));
        $bodyHtml = $this->normalizeEncodedPlaceholders((string) ($template['body_html'] ?? ''));
        $bodyText = $template['body_text'] !== null
            ? $this->normalizeEncodedPlaceholders((string) $template['body_text'])
            : null;

        return [
            'subject' => strtr($subject, $replacements),
            'body_html' => strtr($bodyHtml, $replacements),
            'body_text' => $bodyText !== null
                ? strtr($bodyText, $replacements)
                : null,
            'is_enabled' => (bool) ($template['is_enabled'] ?? true),
        ];
    }

    private function buildReplacements(array $context, string $prefix = ''): array
    {
        $replacements = [];

        foreach ($context as $key => $value) {
            $composite = $prefix === '' ? (string) $key : "{$prefix}.{$key}";

            if (is_array($value)) {
                $replacements += $this->buildReplacements($value, $composite);
                continue;
            }

            $replacements['{{'.$composite.'}}'] = is_scalar($value) || $value === null
                ? (string) ($value ?? '')
                : '';
        }

        return $replacements;
    }

    private function defaultTemplates(): array
    {
        return [
            NotificationEventCatalog::EVENT_FREE_TRIAL_WELCOME => [
                'en' => [
                    'subject' => 'Your free trial is ready',
                    'body_html' => '<p>Hello {{user.name}},</p><p>Your <strong>{{tenant.name}}</strong> workspace is ready with a 7-day Hostinvo trial.</p><p>You can open your workspace from the link below.</p><p><a href="{{links.login_url}}" target="_blank" rel="noopener">Open workspace</a></p><p>If you are prompted during first sign-in, verify your email address first.</p><p>{{links.login_url}}</p>',
                    'body_text' => 'Hello {{user.name}}, your {{tenant.name}} workspace is ready with a 7-day Hostinvo trial. Open your workspace here: {{links.login_url}}. If prompted during first sign-in, verify your email address first.',
                    'is_enabled' => true,
                ],
                'ar' => [
                    'subject' => 'تم تفعيل التجربة المجانية',
                    'body_html' => '<p>مرحباً {{user.name}}،</p><p>أصبحت مساحة {{tenant.name}} جاهزة مع تجربة Hostinvo لمدة 7 أيام.</p><p>يمكنك تسجيل الدخول من <a href="{{links.login_url}}">{{links.login_url}}</a>.</p>',
                    'body_text' => 'مرحباً {{user.name}}، أصبحت مساحة {{tenant.name}} جاهزة مع تجربة Hostinvo لمدة 7 أيام. سجّل الدخول من {{links.login_url}}.',
                    'is_enabled' => true,
                ],
            ],
            NotificationEventCatalog::EVENT_ACCOUNT_EMAIL_VERIFICATION => [
                'en' => [
                    'subject' => 'Verify your email address',
                    'body_html' => '<p>Hello {{user.name}},</p><p>Verify your email address to activate your Hostinvo account and complete your first sign-in.</p><p><a href="{{verification_url}}" target="_blank" rel="noopener">Verify email address</a></p><p>If the button does not open, copy and paste this link into your browser:</p><p>{{verification_url}}</p>',
                    'body_text' => 'Hello {{user.name}}, verify your email address to activate your Hostinvo account: {{verification_url}}',
                    'is_enabled' => true,
                ],
                'ar' => [
                    'subject' => 'تحقق من بريدك الإلكتروني',
                    'body_html' => '<p>مرحباً {{user.name}}،</p><p>يرجى التحقق من بريدك الإلكتروني لتفعيل حساب Hostinvo.</p><p><a href="{{verification_url}}">التحقق من البريد الإلكتروني</a></p>',
                    'body_text' => 'مرحباً {{user.name}}، يرجى التحقق من بريدك الإلكتروني عبر الرابط: {{verification_url}}',
                    'is_enabled' => true,
                ],
            ],
            NotificationEventCatalog::EVENT_ORDER_PLACED => [
                'en' => [
                    'subject' => 'Your order {{order.reference_number}} was placed',
                    'body_html' => '<p>Hello {{client.name}},</p><p>Your order {{order.reference_number}} has been placed successfully.</p>',
                    'body_text' => 'Hello {{client.name}}, your order {{order.reference_number}} has been placed successfully.',
                    'is_enabled' => true,
                ],
                'ar' => [
                    'subject' => 'تم إنشاء الطلب {{order.reference_number}}',
                    'body_html' => '<p>مرحباً {{client.name}}،</p><p>تم إنشاء طلبك {{order.reference_number}} بنجاح.</p>',
                    'body_text' => 'مرحباً {{client.name}}، تم إنشاء طلبك {{order.reference_number}} بنجاح.',
                    'is_enabled' => true,
                ],
            ],
            NotificationEventCatalog::EVENT_INVOICE_CREATED => [
                'en' => [
                    'subject' => 'Invoice {{invoice.reference_number}} is ready',
                    'body_html' => '<p>Hello {{client.name}},</p><p>Invoice {{invoice.reference_number}} for {{invoice.total}} is now available.</p>',
                    'body_text' => 'Hello {{client.name}}, invoice {{invoice.reference_number}} for {{invoice.total}} is now available.',
                    'is_enabled' => true,
                ],
                'ar' => [
                    'subject' => 'الفاتورة {{invoice.reference_number}} جاهزة',
                    'body_html' => '<p>مرحباً {{client.name}}،</p><p>الفاتورة {{invoice.reference_number}} بقيمة {{invoice.total}} أصبحت متاحة الآن.</p>',
                    'body_text' => 'مرحباً {{client.name}}، الفاتورة {{invoice.reference_number}} بقيمة {{invoice.total}} أصبحت متاحة الآن.',
                    'is_enabled' => true,
                ],
            ],
            NotificationEventCatalog::EVENT_PAYMENT_REMINDER => [
                'en' => [
                    'subject' => 'Payment reminder for invoice {{invoice.reference_number}}',
                    'body_html' => '<p>Hello {{client.name}},</p><p>This is a reminder that invoice {{invoice.reference_number}} remains unpaid.</p>',
                    'body_text' => 'Hello {{client.name}}, invoice {{invoice.reference_number}} remains unpaid.',
                    'is_enabled' => true,
                ],
                'ar' => [
                    'subject' => 'تذكير بالسداد للفواتير {{invoice.reference_number}}',
                    'body_html' => '<p>مرحباً {{client.name}}،</p><p>هذا تذكير بأن الفاتورة {{invoice.reference_number}} ما زالت غير مدفوعة.</p>',
                    'body_text' => 'مرحباً {{client.name}}، هذه تذكرة بأن الفاتورة {{invoice.reference_number}} ما زالت غير مدفوعة.',
                    'is_enabled' => true,
                ],
            ],
            NotificationEventCatalog::EVENT_PAYMENT_RECEIPT => [
                'en' => [
                    'subject' => 'Payment received for invoice {{invoice.reference_number}}',
                    'body_html' => '<p>Hello {{client.name}},</p><p>We received your payment for invoice {{invoice.reference_number}}.</p>',
                    'body_text' => 'Hello {{client.name}}, we received your payment for invoice {{invoice.reference_number}}.',
                    'is_enabled' => true,
                ],
                'ar' => [
                    'subject' => 'تم استلام سداد الفاتورة {{invoice.reference_number}}',
                    'body_html' => '<p>مرحباً {{client.name}}،</p><p>تم استلام دفعتك للفاتورة {{invoice.reference_number}}.</p>',
                    'body_text' => 'مرحباً {{client.name}}، تم استلام دفعتك للفاتورة {{invoice.reference_number}}.',
                    'is_enabled' => true,
                ],
            ],
            NotificationEventCatalog::EVENT_TRIAL_EXPIRY_REMINDER => [
                'en' => [
                    'subject' => 'Your trial expires soon',
                    'body_html' => '<p>Hello {{user.name}},</p><p>Your Hostinvo trial for {{tenant.name}} expires on {{license.expires_at}}.</p>',
                    'body_text' => 'Hello {{user.name}}, your Hostinvo trial for {{tenant.name}} expires on {{license.expires_at}}.',
                    'is_enabled' => true,
                ],
                'ar' => [
                    'subject' => 'ستنتهي التجربة قريباً',
                    'body_html' => '<p>مرحباً {{user.name}}،</p><p>ستنتهي تجربة Hostinvo الخاصة بـ {{tenant.name}} في {{license.expires_at}}.</p>',
                    'body_text' => 'مرحباً {{user.name}}، ستنتهي تجربة Hostinvo الخاصة بـ {{tenant.name}} في {{license.expires_at}}.',
                    'is_enabled' => true,
                ],
            ],
            NotificationEventCatalog::EVENT_TENANT_SUSPENDED => [
                'en' => [
                    'subject' => 'Your tenant workspace was suspended',
                    'body_html' => '<p>Hello {{user.name}},</p><p>Your workspace {{tenant.name}} has been suspended. Contact support for assistance.</p>',
                    'body_text' => 'Hello {{user.name}}, your workspace {{tenant.name}} has been suspended. Contact support for assistance.',
                    'is_enabled' => true,
                ],
                'ar' => [
                    'subject' => 'تم تعليق مساحة المستأجر',
                    'body_html' => '<p>مرحباً {{user.name}}،</p><p>تم تعليق مساحة العمل {{tenant.name}}. يرجى التواصل مع الدعم للمساعدة.</p>',
                    'body_text' => 'مرحباً {{user.name}}، تم تعليق مساحة العمل {{tenant.name}}. يرجى التواصل مع الدعم للمساعدة.',
                    'is_enabled' => true,
                ],
            ],
            NotificationEventCatalog::EVENT_TENANT_REACTIVATED => [
                'en' => [
                    'subject' => 'Your tenant workspace was reactivated',
                    'body_html' => '<p>Hello {{user.name}},</p><p>Your workspace {{tenant.name}} has been reactivated.</p>',
                    'body_text' => 'Hello {{user.name}}, your workspace {{tenant.name}} has been reactivated.',
                    'is_enabled' => true,
                ],
                'ar' => [
                    'subject' => 'تمت إعادة تفعيل مساحة المستأجر',
                    'body_html' => '<p>مرحباً {{user.name}}،</p><p>تمت إعادة تفعيل مساحة العمل {{tenant.name}}.</p>',
                    'body_text' => 'مرحباً {{user.name}}، تمت إعادة تفعيل مساحة العمل {{tenant.name}}.',
                    'is_enabled' => true,
                ],
            ],
        ];
    }

    private function normalizeEncodedPlaceholders(string $value): string
    {
        return (string) preg_replace_callback(
            '/%7B%7B.*?%7D%7D/i',
            static fn (array $matches): string => rawurldecode($matches[0]),
            $value,
        );
    }
}
