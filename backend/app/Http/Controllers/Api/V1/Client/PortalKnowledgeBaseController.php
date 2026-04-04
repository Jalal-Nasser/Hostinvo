<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\Portal\KnowledgeBaseCategoryResource;
use App\Services\Portal\PortalContentService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Request;

class PortalKnowledgeBaseController extends Controller
{
    public function index(Request $request, PortalContentService $portalContentService): AnonymousResourceCollection
    {
        return KnowledgeBaseCategoryResource::collection(
            collect($portalContentService->publishedKnowledgeBaseCategories($request->user()->tenant))
        );
    }
}
