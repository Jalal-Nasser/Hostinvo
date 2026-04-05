<?php

namespace App\Http\Controllers\Api\V1\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notifications\UpdateNotificationTemplateRequest;
use App\Models\NotificationTemplate;
use App\Services\Notifications\NotificationEventCatalog;
use App\Services\Notifications\NotificationTemplateService;
use Illuminate\Http\JsonResponse;

class PlatformNotificationTemplateController extends Controller
{
    public function index(NotificationTemplateService $templates): JsonResponse
    {
        abort_unless(request()->user()?->hasRole('super_admin'), 403);

        return $this->success([
            'scope' => NotificationEventCatalog::SCOPE_PLATFORM,
            'events' => $this->eventsForScope(NotificationEventCatalog::SCOPE_PLATFORM),
            'templates' => $templates
                ->templatesForScope(null, NotificationEventCatalog::SCOPE_PLATFORM)
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
        abort_unless($request->user()?->hasRole('super_admin'), 403);

        $this->guardEventAndLocale($event, $locale, NotificationEventCatalog::SCOPE_PLATFORM);

        $template = $templates->updateTemplate(
            tenant: null,
            scope: NotificationEventCatalog::SCOPE_PLATFORM,
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
