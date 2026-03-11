<?php

namespace App\Http\Middleware;

use App\Services\Monitoring\MetricsService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class CaptureRequestMetrics
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set('monitoring.request_start', microtime(true));

        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        $startedAt = (float) $request->attributes->get('monitoring.request_start', microtime(true));
        $latencyMs = max(0, (microtime(true) - $startedAt) * 1000);

        try {
            app(MetricsService::class)->recordRequest(
                (string) $request->path(),
                $response->getStatusCode(),
                $latencyMs,
            );
        } catch (Throwable) {
            // Ignore metrics write failures.
        }
    }
}
