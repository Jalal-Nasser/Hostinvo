<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Services\Security\TurnstileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthConfigController extends Controller
{
    public function __invoke(Request $request, TurnstileService $turnstile): JsonResponse
    {
        return $this->success([
            'turnstile' => $turnstile->publicConfig($request),
        ]);
    }
}
