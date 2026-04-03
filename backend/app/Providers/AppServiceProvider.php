<?php

namespace App\Providers;

use App\Contracts\Licensing\LicenseVerifierInterface;
use App\Queue\Failed\TenantAwareDatabaseUuidFailedJobProvider;
use App\Services\Licensing\RemoteLicenseVerifier;
use App\Services\Monitoring\MetricsService;
use App\Models\Role;
use App\Models\Tenant;
use App\Session\TenantDatabaseSessionHandler;
use App\Support\Auth\PasswordResetTenantContext;
use App\Support\Tenancy\CurrentTenant;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Queue\Failed\FailedJobProviderInterface;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Queue\Events\JobProcessed;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Queue;
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
        $this->app->singleton(LicenseVerifierInterface::class, RemoteLicenseVerifier::class);

        $this->app->extend('queue.failer', function (FailedJobProviderInterface $failer, $app) {
            $config = (array) $app['config']->get('queue.failed', []);

            if (($config['driver'] ?? null) !== 'database-uuids') {
                return $failer;
            }

            return new TenantAwareDatabaseUuidFailedJobProvider(
                $app['db'],
                (string) ($config['database'] ?? $app['config']->get('database.default')),
                (string) ($config['table'] ?? 'failed_jobs'),
                $app->make(CurrentTenant::class),
            );
        });
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

        Queue::createPayloadUsing(function (): array {
            $tenantId = $this->resolveQueueTenantId();

            return filled($tenantId)
                ? ['tenant_id' => $tenantId]
                : [];
        });

        Queue::after(function (JobProcessed $event): void {
            app(MetricsService::class)->recordJobProcessed($event->job->getQueue());
        });

        Queue::failing(function (JobFailed $event): void {
            app(MetricsService::class)->recordJobFailed($event->job->getQueue());
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
            $frontendUrl = rtrim((string) config('app.portal_url', config('app.frontend_url')), '/');
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

    private function resolveQueueTenantId(): ?string
    {
        $currentTenantId = app(CurrentTenant::class)->id();

        if (filled($currentTenantId)) {
            return $currentTenantId;
        }

        $tenant = app()->bound('tenant') ? app('tenant') : null;

        if ($tenant instanceof Tenant && filled($tenant->getKey())) {
            return (string) $tenant->getKey();
        }

        $user = auth()->user();

        return filled($user?->tenant_id) ? (string) $user->tenant_id : null;
    }
}
