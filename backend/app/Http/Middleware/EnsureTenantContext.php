<?php

namespace App\Http\Middleware;

use App\Support\Http\ApiResponse;
use App\Support\Tenancy\CurrentTenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantContext
{
    use ApiResponse;

    public function __construct(
        private readonly CurrentTenant $currentTenant,
    ) {
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $hasTenantId = filled($request->user()?->tenant_id);
        $hasResolvedTenant = $this->currentTenant->resolved();

        if ($hasTenantId && $hasResolvedTenant) {
            return $next($request);
        }

        $message = 'An active tenant workspace is required for this request.';

        if ($request->expectsJson() || $request->is('api/*')) {
            return $this->failure(
                $message,
                Response::HTTP_UNPROCESSABLE_ENTITY,
                [[
                    'message' => $message,
                    'reason' => 'tenant_context_missing',
                ]],
            );
        }

        return response($message, Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
