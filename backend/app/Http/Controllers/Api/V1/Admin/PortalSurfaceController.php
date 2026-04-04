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

        return $this->success($portalSurfaceService->get($request->user()->tenant));
    }

    public function update(UpdatePortalSurfaceRequest $request, PortalSurfaceService $portalSurfaceService): JsonResponse
    {
        return $this->success(
            $portalSurfaceService->update($request->user()->tenant, $request->validated())
        );
    }
}
