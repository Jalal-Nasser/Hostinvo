<?php

use App\Http\Controllers\Api\V1\HealthCheckController;
use Illuminate\Support\Facades\Route;

Route::middleware(['api'])
    ->prefix('v1')
    ->name('api.v1.')
    ->group(function (): void {
        Route::get('/health', HealthCheckController::class)->name('health');

        Route::prefix('auth')
            ->name('auth.')
            ->group(base_path('routes/api/v1/auth.php'));

        Route::prefix('admin')
            ->name('admin.')
            ->middleware(['auth:sanctum', 'resolve.tenant'])
            ->group(base_path('routes/api/v1/admin.php'));

        Route::prefix('client')
            ->name('client.')
            ->middleware(['auth:sanctum', 'resolve.tenant'])
            ->group(base_path('routes/api/v1/client.php'));
    });
