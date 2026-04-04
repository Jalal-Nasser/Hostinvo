<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\Portal\PortalContentBlockResource;
use App\Services\Portal\PortalContentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PortalContentBlockController extends Controller
{
    public function index(Request $request, PortalContentService $portalContentService): AnonymousResourceCollection
    {
        return PortalContentBlockResource::collection(
            collect($portalContentService->publishedContentBlocks($request->user()->tenant, $request->string('section')->toString()))
        );
    }
}
