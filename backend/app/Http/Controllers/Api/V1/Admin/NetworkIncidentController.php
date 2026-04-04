<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Portal\UpsertNetworkIncidentRequest;
use App\Http\Resources\Portal\NetworkIncidentResource;
use App\Models\NetworkIncident;
use App\Services\Portal\PortalContentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class NetworkIncidentController extends Controller
{
    public function index(Request $request, PortalContentService $portalContentService): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NetworkIncident::class);

        return NetworkIncidentResource::collection(
            $portalContentService->paginateNetworkIncidents($request->query())
        );
    }

    public function store(UpsertNetworkIncidentRequest $request, PortalContentService $portalContentService)
    {
        $incident = $portalContentService->saveNetworkIncident(null, $request->validated(), $request->user()->tenant);

        return (new NetworkIncidentResource($incident))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(NetworkIncident $networkIncident): NetworkIncidentResource
    {
        $this->authorize('view', $networkIncident);

        return new NetworkIncidentResource($networkIncident);
    }

    public function update(
        UpsertNetworkIncidentRequest $request,
        NetworkIncident $networkIncident,
        PortalContentService $portalContentService
    ): NetworkIncidentResource {
        return new NetworkIncidentResource(
            $portalContentService->saveNetworkIncident($networkIncident, $request->validated(), $request->user()->tenant)
        );
    }

    public function destroy(NetworkIncident $networkIncident, PortalContentService $portalContentService): Response
    {
        $this->authorize('delete', $networkIncident);
        $portalContentService->delete($networkIncident);

        return response()->noContent();
    }
}
