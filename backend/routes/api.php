<?php

use App\Http\Controllers\Api\V1\HealthCheckController;
use App\Http\Controllers\Api\V1\LicensingController;
use App\Http\Controllers\Api\V1\PlanCatalogController;
use App\Http\Controllers\Api\V1\WebhookController;
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
            });
    });
