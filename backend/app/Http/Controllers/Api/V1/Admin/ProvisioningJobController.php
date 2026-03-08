<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Provisioning\IndexProvisioningJobRequest;
use App\Http\Resources\Provisioning\ProvisioningJobResource;
use App\Models\ProvisioningJob;
use App\Services\Provisioning\ProvisioningService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProvisioningJobController extends Controller
{
    public function index(
        IndexProvisioningJobRequest $request,
        ProvisioningService $provisioningService
    ): AnonymousResourceCollection {
        return ProvisioningJobResource::collection(
            $provisioningService->paginateJobs($request->validated())
        );
    }

    public function show(
        ProvisioningJob $provisioningJob,
        ProvisioningService $provisioningService
    ): ProvisioningJobResource {
        $this->authorize('view', $provisioningJob);

        return new ProvisioningJobResource(
            $provisioningService->getJobForDisplay($provisioningJob)
        );
    }
}
