<?php

namespace App\Http\Middleware;

use App\Contracts\Repositories\Auth\TenantRepositoryInterface;
use App\Support\Tenancy\CurrentTenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
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
        $sessionStore = $request->hasSession() ? $request->session() : Session::driver();

        if (! $user || blank($user->tenant_id)) {
            $currentTenant->clear();
            app()->forgetInstance('tenant');

            return $next($request);
        }

        $sessionTenantId = $sessionStore->get('tenant_id');

        if (filled($sessionTenantId) && $sessionTenantId !== $user->tenant_id) {
            Auth::guard('web')->logout();
            Auth::forgetGuards();
            $request->setUserResolver(static fn () => null);
            $sessionStore->invalidate();
            $sessionStore->regenerateToken();
            $currentTenant->clear();
            app()->forgetInstance('tenant');

            return response()->json([
                'message' => __('auth.session_tenant_mismatch'),
            ], Response::HTTP_UNAUTHORIZED);
        }

        $tenant = $user->relationLoaded('tenant')
            ? $user->tenant
            : $this->tenants->findById($user->tenant_id);

        $sessionStore->put('tenant_id', $user->tenant_id);
        $currentTenant->set($tenant);
        app()->instance('tenant', $tenant);

        return $next($request);
    }
}
