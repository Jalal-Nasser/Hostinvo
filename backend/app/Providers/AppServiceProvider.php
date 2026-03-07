<?php

namespace App\Providers;

use App\Models\Role;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by(
                $request->user()?->getAuthIdentifier() ?: $request->ip()
            );
        });

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        Gate::before(function ($user, string $ability) {
            return $user->hasRole(Role::SUPER_ADMIN) ? true : null;
        });

        ResetPassword::createUrlUsing(function ($user, string $token): string {
            $locale = $user->locale ?: config('app.locale');
            $frontendUrl = rtrim(config('app.frontend_url'), '/');

            return sprintf(
                '%s/%s/auth/reset-password?token=%s&email=%s',
                $frontendUrl,
                $locale,
                $token,
                urlencode($user->email)
            );
        });
    }
}
