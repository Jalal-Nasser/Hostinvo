<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Support\Tenancy\CurrentTenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $currentTenant = app(CurrentTenant::class);
        $user = $request->user();

        if (! $user || blank($user->tenant_id)) {
            $currentTenant->clear();
            app()->forgetInstance('tenant');

            return $next($request);
        }

        $tenant = $user->relationLoaded('tenant')
            ? $user->tenant
            : Tenant::query()->find($user->tenant_id);

        $currentTenant->set($tenant);
        app()->instance('tenant', $tenant);

        return $next($request);
    }
}
