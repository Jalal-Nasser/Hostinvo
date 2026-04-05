<?php

use App\Http\Controllers\Api\V1\HealthCheckController;
use App\Http\Controllers\Api\V1\LicensingController;
use App\Http\Controllers\Api\V1\PlanCatalogController;
use App\Http\Controllers\Api\V1\WebhookController;
use App\Http\Controllers\Api\V1\Admin\TenantContextController;
use App\Http\Controllers\Api\V1\Platform\PlatformNotificationTemplateController;
use App\Http\Controllers\Api\V1\Platform\PlatformTurnstileController;
use Illuminate\Support\Facades\Route;

$supportedWebhookGateways = array_keys((array) config('payments.gateways', []));

Route::middleware(['api'])
    ->prefix('v1')
    ->name('api.v1.')
    ->group(function () use ($supportedWebhookGateways): void {
        Route::get('/health', HealthCheckController::class)->name('health');
        Route::get('/plans', PlanCatalogController::class)->name('plans.index');

        Route::prefix('auth')
            ->name('auth.')
            ->group(base_path('routes/api/v1/auth.php'));

        Route::prefix('admin')
            ->name('admin.')
            ->middleware(['auth:sanctum'])
            ->group(function (): void {
                Route::post('tenants/{tenant}/switch', [TenantContextController::class, 'switchTenant'])->name('tenants.switch');
                Route::post('tenant-context/clear', [TenantContextController::class, 'clear'])->name('tenant-context.clear');
            });

        Route::prefix('admin')
            ->name('admin.')
            ->middleware(['auth:sanctum', 'resolve.tenant', 'license.valid'])
            ->group(base_path('routes/api/v1/admin.php'));

        Route::prefix('client')
            ->name('client.')
            ->middleware(['auth:sanctum', 'resolve.tenant', 'license.valid'])
            ->group(base_path('routes/api/v1/client.php'));

        Route::prefix('webhooks')
            ->name('webhooks.')
            ->middleware(['throttle:webhooks'])
            ->group(function () use ($supportedWebhookGateways): void {
                Route::post('{gateway}', WebhookController::class)
                    ->whereIn('gateway', $supportedWebhookGateways)
                    ->name('handle');
            });

        Route::prefix('licensing')
            ->name('licensing.')
            ->middleware('throttle:auth')
            ->group(function (): void {
                Route::post('validate', [LicensingController::class, 'validateLicense'])->name('validate');
                Route::post('activate', [LicensingController::class, 'activate'])->name('activate');
            });

        Route::prefix('platform')
            ->name('platform.')
            ->middleware(['auth:sanctum'])
            ->group(function (): void {
                Route::get('plans', [PlanCatalogController::class, 'index'])->name('plans.index');
                Route::put('plans', [\App\Http\Controllers\Api\V1\Admin\PlatformPlanController::class, 'update'])->name('plans.update');
                Route::get('security/turnstile', [PlatformTurnstileController::class, 'show'])->name('security.turnstile.show');
                Route::put('security/turnstile', [PlatformTurnstileController::class, 'update'])->name('security.turnstile.update');
                Route::get('notifications/templates', [PlatformNotificationTemplateController::class, 'index'])->name('notifications.templates.index');
                Route::put('notifications/templates/{event}/{locale}', [PlatformNotificationTemplateController::class, 'update'])->name('notifications.templates.update');
            });
    });
