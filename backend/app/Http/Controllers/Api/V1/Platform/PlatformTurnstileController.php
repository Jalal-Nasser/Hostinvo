<?php

namespace App\Http\Controllers\Api\V1\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Security\UpdateTurnstileSettingsRequest;
use App\Services\Security\TurnstileService;
use Illuminate\Http\JsonResponse;

class PlatformTurnstileController extends Controller
{
    public function show(TurnstileService $turnstile): JsonResponse
    {
        abort_unless(request()->user()?->hasRole('super_admin'), 403);

        return $this->success($turnstile->platformConfig());
    }

    public function update(
        UpdateTurnstileSettingsRequest $request,
        TurnstileService $turnstile,
    ): JsonResponse {
        abort_unless($request->user()?->hasRole('super_admin'), 403);

        return $this->success(
            $turnstile->updatePlatformConfig($request->validated())
        );
    }
}
