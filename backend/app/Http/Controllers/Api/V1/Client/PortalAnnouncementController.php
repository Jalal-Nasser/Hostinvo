<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\Portal\AnnouncementResource;
use App\Services\Portal\PortalContentService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Request;

class PortalAnnouncementController extends Controller
{
    public function index(Request $request, PortalContentService $portalContentService): AnonymousResourceCollection
    {
        return AnnouncementResource::collection(
            collect($portalContentService->publishedAnnouncements($request->user()->tenant, (int) $request->integer('limit', 10)))
        );
    }
}
