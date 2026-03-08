<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Provisioning\RetryProvisioningJobRequest;
use App\Http\Resources\Provisioning\ProvisioningJobResource;
use App\Models\ProvisioningJob;
use App\Services\Provisioning\ProvisioningService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ProvisioningJobRetryController extends Controller
{
    public function store(
        RetryProvisioningJobRequest $request,
        ProvisioningJob $provisioningJob,
        ProvisioningService $provisioningService
    ): JsonResponse {
        $job = $provisioningService->retryFailedJob($provisioningJob, $request->user());

        return (new ProvisioningJobResource($job))
            ->response()
            ->setStatusCode(Response::HTTP_ACCEPTED);
    }
}
