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

        $tenant = $request->user()?->tenant;

        if (! $tenant) {
            return $this->failure('Tenant branding settings require an active tenant workspace.', 422);
        }

        return $this->success($brandingService->get($tenant));
    }

    public function update(UpdateTenantBrandingRequest $request, TenantBrandingService $brandingService): JsonResponse
    {
        $tenant = $request->user()?->tenant;

        if (! $tenant) {
            return $this->failure('Tenant branding settings require an active tenant workspace.', 422);
        }

        return $this->success(
            $brandingService->update($tenant, $request->validated())
        );
    }
}
