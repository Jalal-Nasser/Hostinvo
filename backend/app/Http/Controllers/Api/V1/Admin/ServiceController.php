<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Provisioning\IndexServiceRequest;
use App\Http\Requests\Provisioning\StoreServiceRequest;
use App\Http\Requests\Provisioning\UpdateServiceRequest;
use App\Http\Resources\Provisioning\ServiceResource;
use App\Models\Service;
use App\Services\Provisioning\ProvisioningService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ServiceController extends Controller
{
    public function index(IndexServiceRequest $request, ProvisioningService $provisioningService): AnonymousResourceCollection
    {
        return ServiceResource::collection(
            $provisioningService->paginateServices($request->validated())
        );
    }

    public function store(StoreServiceRequest $request, ProvisioningService $provisioningService): JsonResponse
    {
        $service = $provisioningService->createService($request->validated(), $request->user());

        return (new ServiceResource($service))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Service $service, ProvisioningService $provisioningService): ServiceResource
    {
        $this->authorize('view', $service);

        return new ServiceResource(
            $provisioningService->getServiceForDisplay($service)
        );
    }

    public function update(
        UpdateServiceRequest $request,
        Service $service,
        ProvisioningService $provisioningService
    ): ServiceResource {
        return new ServiceResource(
            $provisioningService->updateService($service, $request->validated(), $request->user())
        );
    }

    public function duplicate(Service $service, ProvisioningService $provisioningService): JsonResponse
    {
        $this->authorize('create', Service::class);
        $this->authorize('view', $service);

        $copy = $provisioningService->duplicateService($service, request()->user());

        return (new ServiceResource($copy))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function destroy(Service $service, ProvisioningService $provisioningService): Response
    {
        $this->authorize('delete', $service);

        $provisioningService->deleteService($service);

        return response()->noContent();
    }
}
