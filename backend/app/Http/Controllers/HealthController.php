<?php

namespace App\Http\Controllers;

use App\Services\System\HealthCheckService;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function __construct(
        private readonly HealthCheckService $healthChecks,
    ) {}

    public function index(): JsonResponse
    {
        return $this->respond($this->healthChecks->overall());
    }

    public function database(): JsonResponse
    {
        $database = $this->healthChecks->database();

        return $this->respond([
            'status' => $database['status'],
            'timestamp' => now()->toIso8601String(),
            'checks' => [
                'database' => $database,
            ],
        ]);
    }

    public function queue(): JsonResponse
    {
        $queue = $this->healthChecks->queue();

        return $this->respond([
            'status' => $queue['status'],
            'timestamp' => now()->toIso8601String(),
            'checks' => [
                'queue' => $queue,
            ],
        ]);
    }

    public function redis(): JsonResponse
    {
        $redis = $this->healthChecks->redis();

        return $this->respond([
            'status' => $redis['status'],
            'timestamp' => now()->toIso8601String(),
            'checks' => [
                'redis' => $redis,
            ],
        ]);
    }

    private function respond(array $payload): JsonResponse
    {
        $statusCode = $payload['status'] === 'ok' ? 200 : 503;
        $errors = $statusCode === 200 ? [] : [[
            'message' => 'Health check failed.',
        ]];

        return response()->json([
            'data' => $payload,
            'meta' => (object) [],
            'errors' => $errors,
        ], $statusCode);
    }
}
