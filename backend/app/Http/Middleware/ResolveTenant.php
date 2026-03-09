<?php

namespace App\Http\Middleware;

use App\Contracts\Repositories\Auth\TenantRepositoryInterface;
use App\Support\Tenancy\CurrentTenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function __construct(
        private readonly TenantRepositoryInterface $tenants,
    ) {}

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

        $sessionTenantId = $request->hasSession()
            ? $request->session()->get('tenant_id')
            : null;

        if (filled($sessionTenantId) && $sessionTenantId !== $user->tenant_id) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            $currentTenant->clear();
            app()->forgetInstance('tenant');

            return response()->json([
                'message' => __('auth.session_tenant_mismatch'),
            ], Response::HTTP_UNAUTHORIZED);
        }

        $tenant = $user->relationLoaded('tenant')
            ? $user->tenant
            : $this->tenants->findById($user->tenant_id);

        if ($request->hasSession()) {
            $request->session()->put('tenant_id', $user->tenant_id);
        }
        $currentTenant->set($tenant);
        app()->instance('tenant', $tenant);

        return $next($request);
    }
}
