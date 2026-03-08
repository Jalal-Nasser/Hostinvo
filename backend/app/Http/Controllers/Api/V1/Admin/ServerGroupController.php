<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Provisioning\IndexServerGroupRequest;
use App\Http\Requests\Provisioning\StoreServerGroupRequest;
use App\Http\Requests\Provisioning\UpdateServerGroupRequest;
use App\Http\Resources\Provisioning\ServerGroupResource;
use App\Models\ServerGroup;
use App\Services\Provisioning\ServerManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ServerGroupController extends Controller
{
    public function index(
        IndexServerGroupRequest $request,
        ServerManagementService $serverManagementService
    ): AnonymousResourceCollection {
        return ServerGroupResource::collection(
            $serverManagementService->paginateServerGroups($request->validated())
        );
    }

    public function store(
        StoreServerGroupRequest $request,
        ServerManagementService $serverManagementService
    ): JsonResponse {
        $serverGroup = $serverManagementService->createServerGroup($request->validated(), $request->user());

        return (new ServerGroupResource($serverGroup))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(
        ServerGroup $serverGroup,
        ServerManagementService $serverManagementService
    ): ServerGroupResource {
        $this->authorize('view', $serverGroup);

        return new ServerGroupResource(
            $serverManagementService->getServerGroupForDisplay($serverGroup)
        );
    }

    public function update(
        UpdateServerGroupRequest $request,
        ServerGroup $serverGroup,
        ServerManagementService $serverManagementService
    ): ServerGroupResource {
        return new ServerGroupResource(
            $serverManagementService->updateServerGroup($serverGroup, $request->validated())
        );
    }

    public function destroy(
        ServerGroup $serverGroup,
        ServerManagementService $serverManagementService
    ): Response {
        $this->authorize('delete', $serverGroup);

        $serverManagementService->deleteServerGroup($serverGroup);

        return response()->noContent();
    }
}
