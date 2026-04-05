<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notifications\UpdateNotificationTemplateRequest;
use App\Models\NotificationTemplate;
use App\Services\Notifications\NotificationEventCatalog;
use App\Services\Notifications\NotificationTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantNotificationTemplateController extends Controller
{
    public function index(Request $request, NotificationTemplateService $templates): JsonResponse
    {
        $this->authorize('viewAny', NotificationTemplate::class);

        $tenant = $request->user()?->tenant;

        if (! $tenant) {
            return $this->failure('Notification templates require an active tenant workspace.', 422);
        }

        return $this->success([
            'scope' => NotificationEventCatalog::SCOPE_TENANT,
            'events' => $this->eventsForScope(NotificationEventCatalog::SCOPE_TENANT),
            'templates' => $templates
                ->templatesForScope($tenant, NotificationEventCatalog::SCOPE_TENANT)
                ->map(fn (NotificationTemplate $template): array => $this->serializeTemplate($template))
                ->values()
                ->all(),
        ]);
    }

    public function update(
        UpdateNotificationTemplateRequest $request,
        string $event,
        string $locale,
        NotificationTemplateService $templates,
    ): JsonResponse {
        $this->authorize('create', NotificationTemplate::class);

        $tenant = $request->user()?->tenant;

        if (! $tenant) {
            return $this->failure('Notification templates require an active tenant workspace.', 422);
        }

        $this->guardEventAndLocale($event, $locale, NotificationEventCatalog::SCOPE_TENANT);

        $template = $templates->updateTemplate(
            tenant: $tenant,
            scope: NotificationEventCatalog::SCOPE_TENANT,
            event: $event,
            locale: $locale,
            attributes: $request->validated(),
        );

        return $this->success($this->serializeTemplate($template));
    }

    private function eventsForScope(string $scope): array
    {
        return collect(NotificationEventCatalog::definitions())
            ->filter(fn (array $definition): bool => $definition['scope'] === $scope)
            ->keys()
            ->values()
            ->all();
    }

    private function serializeTemplate(NotificationTemplate $template): array
    {
        return [
            'id' => $template->getKey(),
            'scope' => $template->scope,
            'event' => $template->event,
            'locale' => $template->locale,
            'subject' => $template->subject,
            'body_html' => $template->body_html,
            'body_text' => $template->body_text,
            'is_enabled' => (bool) $template->is_enabled,
        ];
    }

    private function guardEventAndLocale(string $event, string $locale, string $scope): void
    {
        abort_unless(
            NotificationEventCatalog::scopeFor($event) === $scope
                && in_array($locale, ['en', 'ar'], true),
            404,
        );
    }
}
