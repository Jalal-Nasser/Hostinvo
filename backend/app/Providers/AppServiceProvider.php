<?php

namespace App\Providers;

use App\Models\Role;
use App\Session\TenantDatabaseSessionHandler;
use App\Support\Auth\PasswordResetTenantContext;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(PasswordResetTenantContext::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Session::extend('tenant-database', function ($app) {
            return new TenantDatabaseSessionHandler(
                $app['db']->connection(config('session.connection')),
                config('session.table'),
                config('session.lifetime'),
                $app,
            );
        });

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by(
                $request->user()?->getAuthIdentifier() ?: $request->ip()
            )->response(fn (Request $request, array $headers) => $this->throttleResponse($headers));
        });

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip())
                ->response(fn (Request $request, array $headers) => $this->throttleResponse($headers));
        });

        RateLimiter::for('webhooks', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip())
                ->response(fn (Request $request, array $headers) => $this->throttleResponse($headers));
        });

        RateLimiter::for('ticket-create', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->getAuthIdentifier() ?: $request->ip())
                ->response(fn (Request $request, array $headers) => $this->throttleResponse($headers));
        });

        RateLimiter::for('ticket-reply', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->getAuthIdentifier() ?: $request->ip())
                ->response(fn (Request $request, array $headers) => $this->throttleResponse($headers));
        });

        RateLimiter::for('domain-list', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->getAuthIdentifier() ?: $request->ip())
                ->response(fn (Request $request, array $headers) => $this->throttleResponse($headers));
        });

        RateLimiter::for('domain-actions', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->getAuthIdentifier() ?: $request->ip())
                ->response(fn (Request $request, array $headers) => $this->throttleResponse($headers));
        });

        Gate::before(function ($user, string $ability) {
            return $user->hasRole(Role::SUPER_ADMIN) ? true : null;
        });

        ResetPassword::createUrlUsing(function ($user, string $token): string {
            $locale = $user->locale ?: config('app.locale');
            $frontendUrl = rtrim(config('app.frontend_url'), '/');
            $context = app(PasswordResetTenantContext::class)->buildSignedUrlContext($user, $token);
            $query = http_build_query(array_filter([
                'token' => $token,
                'email' => $user->email,
                'tenant_id' => $context['tenant_id'] ?? null,
                'tenant_signature' => $context['tenant_signature'] ?? null,
            ]));

            return sprintf(
                '%s/%s/auth/reset-password?%s',
                $frontendUrl,
                $locale,
                $query,
            );
        });
    }

    private function throttleResponse(array $headers): JsonResponse
    {
        return response()->json([
            'data' => null,
            'meta' => (object) [],
            'errors' => [[
                'message' => 'Too many requests. Please try again later.',
            ]],
        ], 429, $headers);
    }
}
