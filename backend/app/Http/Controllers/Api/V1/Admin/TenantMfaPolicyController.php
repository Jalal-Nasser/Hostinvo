<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Security\UpdateTenantMfaPolicyRequest;
use App\Models\TenantSetting;
use App\Services\Tenancy\TenantMfaPolicyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantMfaPolicyController extends Controller
{
    public function show(Request $request, TenantMfaPolicyService $policies): JsonResponse
    {
        $this->authorize('viewAny', TenantSetting::class);

        $tenant = $request->user()?->tenant;

        if (! $tenant) {
            return $this->failure('Tenant security settings require an active tenant workspace.', 422);
        }

        return $this->success($policies->tenantConfig($tenant));
    }

    public function update(
        UpdateTenantMfaPolicyRequest $request,
        TenantMfaPolicyService $policies,
    ): JsonResponse {
        $tenant = $request->user()?->tenant;

        if (! $tenant) {
            return $this->failure('Tenant security settings require an active tenant workspace.', 422);
        }

        return $this->success(
            $policies->updateTenantConfig($tenant, $request->validated())
        );
    }
}
