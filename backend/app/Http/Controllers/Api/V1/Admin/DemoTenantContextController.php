<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Services\Tenancy\DemoTenantService;
use App\Services\Tenancy\TenantContextService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class DemoTenantContextController extends Controller
{
    public function store(
        Request $request,
        DemoTenantService $demoTenantService,
        TenantContextService $tenantContextService,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        abort_unless($user->hasRole(Role::SUPER_ADMIN), Response::HTTP_FORBIDDEN);

        $tenant = $demoTenantService->ensure($request->getHost());
        $session = $request->hasSession() ? $request->session() : Session::driver();

        $tenantContextService->switchToTenant($user, $tenant, $session);

        return response()->json([
            'data' => [
                'tenant' => [
                    'id' => $tenant->getKey(),
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'status' => $tenant->status,
                ],
                'owner' => [
                    'name' => $tenant->owner?->name,
                    'email' => $tenant->owner?->email,
                ],
            ],
            'message' => 'Demo tenant dashboard opened.',
        ], Response::HTTP_OK);
    }
}
