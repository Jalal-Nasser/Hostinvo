<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenancy\IndexTenantRequest;
use App\Http\Requests\Tenancy\StoreTenantRequest;
use App\Http\Requests\Tenancy\UpdateTenantRequest;
use App\Http\Resources\Tenancy\TenantResource;
use App\Models\Tenant;
use App\Services\Tenancy\TenantManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class TenantController extends Controller
{
    public function index(IndexTenantRequest $request, TenantManagementService $tenantManagementService): AnonymousResourceCollection
    {
        return TenantResource::collection(
            $tenantManagementService->paginate($request->validated())
        );
    }

    public function store(StoreTenantRequest $request, TenantManagementService $tenantManagementService): JsonResponse
    {
        $tenant = $tenantManagementService->create($request->validated());

        return (new TenantResource($tenant))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Tenant $tenant, TenantManagementService $tenantManagementService): TenantResource
    {
        $this->authorize('view', $tenant);

        return new TenantResource(
            $tenantManagementService->getForDisplay($tenant)
        );
    }

    public function update(UpdateTenantRequest $request, Tenant $tenant, TenantManagementService $tenantManagementService): TenantResource
    {
        return new TenantResource(
            $tenantManagementService->update($tenant, $request->validated())
        );
    }

    public function activate(Tenant $tenant, TenantManagementService $tenantManagementService): TenantResource
    {
        $this->authorize('activate', $tenant);

        return new TenantResource(
            $tenantManagementService->activate($tenant)
        );
    }

    public function suspend(Tenant $tenant, TenantManagementService $tenantManagementService): TenantResource
    {
        $this->authorize('suspend', $tenant);

        return new TenantResource(
            $tenantManagementService->suspend($tenant)
        );
    }
}
