<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\Portal\NetworkIncidentResource;
use App\Services\Portal\PortalContentService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Request;

class PortalNetworkIncidentController extends Controller
{
    public function index(Request $request, PortalContentService $portalContentService): AnonymousResourceCollection
    {
        return NetworkIncidentResource::collection(
            collect($portalContentService->publicIncidents($request->user()->tenant))
        );
    }
}
