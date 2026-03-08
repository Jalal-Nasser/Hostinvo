<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Provisioning\DispatchProvisioningOperationRequest;
use App\Http\Resources\Provisioning\ProvisioningJobResource;
use App\Models\Service;
use App\Services\Provisioning\ProvisioningService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ServiceProvisioningController extends Controller
{
    public function store(
        DispatchProvisioningOperationRequest $request,
        Service $service,
        string $operation,
        ProvisioningService $provisioningService
    ): JsonResponse {
        $job = $provisioningService->dispatchOperation(
            service: $service,
            operation: $operation,
            actor: $request->user(),
            payload: $request->validated()['payload'] ?? [],
        );

        return (new ProvisioningJobResource($job))
            ->response()
            ->setStatusCode(Response::HTTP_ACCEPTED);
    }
}
