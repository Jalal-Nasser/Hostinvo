<?php

use App\Http\Controllers\HealthController;
use App\Http\Controllers\MetricsController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'service' => 'Hostinvo API',
        'status' => 'ok',
    ]);
});

Route::prefix('health')
    ->name('health.')
    ->group(function (): void {
        Route::get('/', [HealthController::class, 'index'])->name('index');
        Route::get('/database', [HealthController::class, 'database'])->name('database');
        Route::get('/queue', [HealthController::class, 'queue'])->name('queue');
        Route::get('/redis', [HealthController::class, 'redis'])->name('redis');
    });

Route::prefix('metrics')
    ->name('metrics.')
    ->middleware('metrics.auth')
    ->group(function (): void {
        Route::get('/', [MetricsController::class, 'prometheus'])->name('prometheus');
        Route::get('/json', [MetricsController::class, 'json'])->name('json');
    });
