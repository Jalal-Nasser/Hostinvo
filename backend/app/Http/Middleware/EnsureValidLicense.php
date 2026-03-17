<?php

namespace App\Http\Middleware;

use App\Services\Licensing\LicenseService;
use App\Support\Http\ApiResponse;
use App\Support\Tenancy\CurrentTenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureValidLicense
{
    use ApiResponse;

    public function __construct(
        private readonly LicenseService $licenseService,
        private readonly CurrentTenant $currentTenant,
    ) {
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = $request->user()?->tenant_id ?? $this->currentTenant->id();

        if (blank($tenantId)) {
            return $next($request);
        }

        $result = $this->licenseService->validateCurrentLicense(
            $tenantId,
            $request->getHost(),
        );

        if ((bool) ($result['valid'] ?? false)) {
            return $next($request);
        }

        $message = (string) ($result['message'] ?? $result['error'] ?? __('licensing.errors.inactive'));
        $reason = (string) ($result['reason'] ?? 'inactive');

        if ($request->expectsJson() || $request->is('api/*')) {
            return $this->failure(
                $message,
                Response::HTTP_FORBIDDEN,
                [[
                    'message' => $message,
                    'reason' => $reason,
                ]]
            );
        }

        return response($message, Response::HTTP_FORBIDDEN);
    }
}
