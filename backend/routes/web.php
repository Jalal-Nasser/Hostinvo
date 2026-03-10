<?php

use App\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

Route::view('/', 'welcome');

Route::prefix('health')
    ->name('health.')
    ->group(function (): void {
        Route::get('/', [HealthController::class, 'index'])->name('index');
        Route::get('/database', [HealthController::class, 'database'])->name('database');
        Route::get('/queue', [HealthController::class, 'queue'])->name('queue');
        Route::get('/redis', [HealthController::class, 'redis'])->name('redis');
    });
