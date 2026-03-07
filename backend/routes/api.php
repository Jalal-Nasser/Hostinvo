<?php

use App\Http\Controllers\Api\V1\HealthCheckController;
use Illuminate\Support\Facades\Route;

Route::middleware(['api', 'resolve.tenant'])
    ->prefix('v1')
    ->name('api.v1.')
    ->group(function (): void {
        Route::get('/health', HealthCheckController::class)->name('health');

        Route::prefix('admin')
            ->name('admin.')
            ->group(base_path('routes/api/v1/admin.php'));

        Route::prefix('client')
            ->name('client.')
            ->group(base_path('routes/api/v1/client.php'));
    });
