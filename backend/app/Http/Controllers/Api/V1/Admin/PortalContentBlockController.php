<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Portal\UpsertPortalContentBlockRequest;
use App\Http\Resources\Portal\PortalContentBlockResource;
use App\Models\PortalContentBlock;
use App\Services\Portal\PortalContentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class PortalContentBlockController extends Controller
{
    public function index(Request $request, PortalContentService $portalContentService): AnonymousResourceCollection
    {
        $this->authorize('viewAny', PortalContentBlock::class);

        return PortalContentBlockResource::collection(
            $portalContentService->paginateContentBlocks($request->query())
        );
    }

    public function store(UpsertPortalContentBlockRequest $request, PortalContentService $portalContentService)
    {
        $block = $portalContentService->saveContentBlock(null, $request->validated(), $request->user()->tenant);

        return (new PortalContentBlockResource($block))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(PortalContentBlock $portalContentBlock): PortalContentBlockResource
    {
        $this->authorize('view', $portalContentBlock);

        return new PortalContentBlockResource($portalContentBlock);
    }

    public function update(
        UpsertPortalContentBlockRequest $request,
        PortalContentBlock $portalContentBlock,
        PortalContentService $portalContentService
    ): PortalContentBlockResource {
        return new PortalContentBlockResource(
            $portalContentService->saveContentBlock($portalContentBlock, $request->validated(), $request->user()->tenant)
        );
    }

    public function destroy(PortalContentBlock $portalContentBlock, PortalContentService $portalContentService): Response
    {
        $this->authorize('delete', $portalContentBlock);
        $portalContentService->delete($portalContentBlock);

        return response()->noContent();
    }
}
