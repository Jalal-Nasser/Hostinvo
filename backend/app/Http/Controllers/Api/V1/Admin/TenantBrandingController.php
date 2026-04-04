<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenancy\UpdateTenantBrandingRequest;
use App\Models\TenantSetting;
use App\Services\Tenancy\TenantBrandingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantBrandingController extends Controller
{
    public function show(Request $request, TenantBrandingService $brandingService): JsonResponse
    {
        $this->authorize('viewAny', TenantSetting::class);

        return $this->success($brandingService->get($request->user()->tenant));
    }

    public function update(UpdateTenantBrandingRequest $request, TenantBrandingService $brandingService): JsonResponse
    {
        return $this->success(
            $brandingService->update($request->user()->tenant, $request->validated())
        );
    }
}
