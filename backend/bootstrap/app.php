<?php

use App\Http\Middleware\ResolveTenant;
use App\Http\Middleware\Auth\EnsureUserHasPermission;
use App\Http\Middleware\Auth\EnsureUserHasRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->throttleApi(redis: extension_loaded('redis'));

        $middleware->alias([
            'permission' => EnsureUserHasPermission::class,
            'resolve.tenant' => ResolveTenant::class,
            'role' => EnsureUserHasRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
