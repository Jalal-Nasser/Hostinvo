<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Provisioning\IndexServerRequest;
use App\Http\Requests\Provisioning\StoreServerRequest;
use App\Http\Requests\Provisioning\UpdateServerRequest;
use App\Http\Resources\Provisioning\ServerResource;
use App\Models\Server;
use App\Services\Provisioning\ServerManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ServerController extends Controller
{
    public function index(IndexServerRequest $request, ServerManagementService $serverManagementService): AnonymousResourceCollection
    {
        return ServerResource::collection(
            $serverManagementService->paginateServers($request->validated())
        );
    }

    public function store(StoreServerRequest $request, ServerManagementService $serverManagementService): JsonResponse
    {
        $server = $serverManagementService->createServer($request->validated(), $request->user());

        return (new ServerResource($server))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Server $server, ServerManagementService $serverManagementService): ServerResource
    {
        $this->authorize('view', $server);

        return new ServerResource(
            $serverManagementService->getServerForDisplay($server)
        );
    }

    public function update(
        UpdateServerRequest $request,
        Server $server,
        ServerManagementService $serverManagementService
    ): ServerResource {
        return new ServerResource(
            $serverManagementService->updateServer($server, $request->validated())
        );
    }

    public function destroy(Server $server, ServerManagementService $serverManagementService): Response
    {
        $this->authorize('delete', $server);

        $serverManagementService->deleteServer($server);

        return response()->noContent();
    }
}
