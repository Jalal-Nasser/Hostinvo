<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Security\UpdateTurnstileSettingsRequest;
use App\Models\TenantSetting;
use App\Services\Security\TurnstileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantTurnstileController extends Controller
{
    public function show(Request $request, TurnstileService $turnstile): JsonResponse
    {
        $this->authorize('viewAny', TenantSetting::class);

        $tenant = $request->user()?->tenant;

        if (! $tenant) {
            return $this->failure('Tenant security settings require an active tenant workspace.', 422);
        }

        return $this->success($turnstile->tenantConfig($tenant));
    }

    public function update(
        UpdateTurnstileSettingsRequest $request,
        TurnstileService $turnstile,
    ): JsonResponse {
        $this->authorize('create', TenantSetting::class);

        $tenant = $request->user()?->tenant;

        if (! $tenant) {
            return $this->failure('Tenant security settings require an active tenant workspace.', 422);
        }

        return $this->success(
            $turnstile->updateTenantConfig($tenant, $request->validated())
        );
    }
}
