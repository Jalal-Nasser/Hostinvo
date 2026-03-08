<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class HealthCheckController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return $this->success([
            'status' => 'ok',
            'application' => config('app.name'),
            'version' => config('hostinvo.api.prefix'),
            'locales' => config('hostinvo.locales'),
            'panels' => config('hostinvo.panel_drivers'),
        ]);
    }
}
