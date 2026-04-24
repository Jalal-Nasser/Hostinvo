<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\TenantDashboardOverviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardOverviewController extends Controller
{
    public function __invoke(
        Request $request,
        TenantDashboardOverviewService $overviewService,
    ): JsonResponse {
        abort_unless($request->user()?->hasPermissionTo('dashboard.view'), 403);

        return $this->success($overviewService->build($request->user()));
    }
}
