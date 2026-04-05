<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Tenancy\TenantManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class TenantImpersonationController extends Controller
{
    public function impersonateAdmin(
        Request $request,
        Tenant $tenant,
        TenantManagementService $tenantManagementService,
    ): JsonResponse {
        $this->authorize('view', $tenant);

        $this->ensureSuperAdmin($request->user());

        $targetUser = $tenantManagementService->resolveImpersonationUser($tenant);

        if (! $targetUser) {
            return response()->json([
                'message' => 'No tenant owner user is available for impersonation.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->startImpersonationSession($request, $targetUser);

        return response()->json([
            'data' => [
                'target_user_id' => $targetUser->id,
                'redirect' => '/dashboard',
            ],
        ]);
    }

    public function impersonatePortal(
        Request $request,
        Tenant $tenant,
        TenantManagementService $tenantManagementService,
    ): JsonResponse {
        $this->authorize('view', $tenant);

        $this->ensureSuperAdmin($request->user());

        $targetUser = $tenantManagementService->resolveImpersonationUser($tenant);

        if (! $targetUser) {
            return response()->json([
                'message' => 'No tenant owner user is available for impersonation.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->startImpersonationSession($request, $targetUser);

        return response()->json([
            'data' => [
                'target_user_id' => $targetUser->id,
                'redirect' => '/portal',
            ],
        ]);
    }

    public function stop(Request $request): JsonResponse
    {
        $impersonatorId = $request->session()->get('impersonator_id');

        if (! $impersonatorId) {
            return response()->json([
                'message' => 'No impersonation session is active.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $impersonator = User::query()->find($impersonatorId);

        if (! $impersonator) {
            return response()->json([
                'message' => 'The impersonating user could not be found.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        Auth::login($impersonator);

        $request->session()->forget([
            'impersonator_id',
            'impersonator_tenant_id',
            'impersonation_started_at',
        ]);

        return response()->json([
            'data' => [
                'redirect' => '/dashboard/tenants',
            ],
        ]);
    }

    private function startImpersonationSession(Request $request, User $targetUser): void
    {
        $impersonator = $request->user();

        $request->session()->put('impersonator_id', $impersonator?->id);
        $request->session()->put('impersonator_tenant_id', $impersonator?->tenant_id);
        $request->session()->put('impersonation_started_at', now()->toISOString());

        Auth::login($targetUser);
    }

    private function ensureSuperAdmin(?User $user): void
    {
        if (! $user || ! $user->hasRole(Role::SUPER_ADMIN)) {
            abort(Response::HTTP_FORBIDDEN);
        }
    }
}
