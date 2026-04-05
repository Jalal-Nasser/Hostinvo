<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenancy\UpdatePortalSurfaceRequest;
use App\Models\TenantSetting;
use App\Services\Tenancy\PortalSurfaceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortalSurfaceController extends Controller
{
    public function show(Request $request, PortalSurfaceService $portalSurfaceService): JsonResponse
    {
        $this->authorize('viewAny', TenantSetting::class);

        $tenant = $request->user()?->tenant;

        if (! $tenant) {
            return $this->failure('Portal surface settings require an active tenant workspace.', 422);
        }

        return $this->success($portalSurfaceService->get($tenant));
    }

    public function update(UpdatePortalSurfaceRequest $request, PortalSurfaceService $portalSurfaceService): JsonResponse
    {
        $tenant = $request->user()?->tenant;

        if (! $tenant) {
            return $this->failure('Portal surface settings require an active tenant workspace.', 422);
        }

        return $this->success(
            $portalSurfaceService->update($tenant, $request->validated())
        );
    }
}
