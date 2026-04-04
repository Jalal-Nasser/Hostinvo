<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\Portal\PortalFooterLinkResource;
use App\Services\Portal\PortalContentService;
use App\Services\Tenancy\PortalSurfaceService;
use App\Services\Tenancy\TenantBrandingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortalConfigController extends Controller
{
    public function __invoke(
        Request $request,
        TenantBrandingService $brandingService,
        PortalSurfaceService $portalSurfaceService,
        PortalContentService $portalContentService,
    ): JsonResponse {
        $tenant = $request->user()->tenant;

        return $this->success([
            'branding' => $brandingService->get($tenant),
            'surface' => $portalSurfaceService->get($tenant),
            'footer_links' => PortalFooterLinkResource::collection(
                collect($portalContentService->visibleFooterLinks($tenant))
            )->resolve($request),
        ]);
    }
}
