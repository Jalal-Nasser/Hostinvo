<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthorizeMetricsAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $configuredToken = (string) config('monitoring.metrics.token', '');

        if ($configuredToken === '') {
            if (! app()->environment(['local', 'testing'])) {
                abort(403, 'Monitoring metrics token is not configured.');
            }

            return $next($request);
        }

        $providedToken = $request->header('X-Metrics-Token')
            ?: $request->bearerToken()
            ?: $request->query('token');

        if (! is_string($providedToken) || ! hash_equals($configuredToken, $providedToken)) {
            abort(403, 'Unauthorized metrics access.');
        }

        return $next($request);
    }
}
