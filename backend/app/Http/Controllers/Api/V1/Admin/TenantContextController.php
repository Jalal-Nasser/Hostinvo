<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Tenancy\TenantContextService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantContextController extends Controller
{
    public function switchTenant(
        Request $request,
        Tenant $tenant,
        TenantContextService $tenantContextService,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        $this->authorize('view', $tenant);

        $tenant = $tenantContextService->switchToTenant($user, $tenant, $request->session());

        return response()->json([
            'data' => [
                'tenant' => [
                    'id' => $tenant->getKey(),
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'status' => $tenant->status,
                ],
            ],
            'message' => 'Tenant context updated.',
        ], Response::HTTP_OK);
    }

    public function clear(
        Request $request,
        TenantContextService $tenantContextService,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        $tenantContextService->clear($user, $request->session());

        return response()->json([
            'data' => [
                'cleared' => true,
            ],
            'message' => 'Tenant context cleared.',
        ], Response::HTTP_OK);
    }
}
