<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Provisioning\IndexPortalServiceRequest;
use App\Http\Resources\Provisioning\ServiceResource;
use App\Models\Service;
use App\Services\Provisioning\ProvisioningService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ServiceController extends Controller
{
    public function index(
        IndexPortalServiceRequest $request,
        ProvisioningService $provisioningService
    ): AnonymousResourceCollection {
        return ServiceResource::collection(
            $provisioningService->paginateServicesForPortal($request->user(), $request->validated())
        );
    }

    public function show(Service $service, ProvisioningService $provisioningService): ServiceResource
    {
        $this->authorize('viewPortal', $service);

        return new ServiceResource(
            $provisioningService->getServiceForPortalDisplay(request()->user(), $service) ?? $service
        );
    }
}
