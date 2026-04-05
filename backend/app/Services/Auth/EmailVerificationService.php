<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Services\Notifications\NotificationDispatchService;
use App\Services\Notifications\NotificationEventCatalog;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class EmailVerificationService
{
    public function __construct(
        private readonly NotificationDispatchService $notifications,
    ) {
    }

    public function send(User $user, ?string $locale = null): void
    {
        if (! $user->email_verification_required || $user->hasVerifiedEmail()) {
            return;
        }

        $resolvedLocale = $locale ?: $user->locale ?: config('app.locale', 'en');
        $verificationUrl = URL::temporarySignedRoute(
            'api.v1.auth.verification.verify',
            now()->addHours(24),
            [
                'id' => $user->getKey(),
                'hash' => sha1($user->getEmailForVerification()),
                'locale' => $resolvedLocale,
            ],
        );

        $this->notifications->send(
            email: $user->email,
            event: NotificationEventCatalog::EVENT_ACCOUNT_EMAIL_VERIFICATION,
            context: [
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'tenant' => [
                    'name' => $user->tenant?->name ?? config('app.name', 'Hostinvo'),
                ],
                'verification_url' => $verificationUrl,
            ],
            tenant: $user->tenant,
            locale: $resolvedLocale,
        );
    }

    public function verify(User $user): void
    {
        if ($user->hasVerifiedEmail()) {
            return;
        }

        $user->forceFill([
            'email_verified_at' => now(),
        ])->save();

        event(new Verified($user));
    }

    public function verificationRedirectUrl(Request $request, string $status, ?string $email = null): string
    {
        $locale = Str::lower((string) $request->route('locale', config('app.locale', 'en')));
        $baseUrl = rtrim((string) config('app.marketing_url', config('app.frontend_url')), '/');
        $query = http_build_query(array_filter([
            'status' => $status,
            'email' => $email,
        ]));

        return sprintf('%s/%s/auth/verify-email?%s', $baseUrl, $locale, $query);
    }
}
