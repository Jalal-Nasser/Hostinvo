<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Portal\UpsertPortalFooterLinkRequest;
use App\Http\Resources\Portal\PortalFooterLinkResource;
use App\Models\PortalFooterLink;
use App\Services\Portal\PortalContentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class PortalFooterLinkController extends Controller
{
    public function index(Request $request, PortalContentService $portalContentService): AnonymousResourceCollection
    {
        $this->authorize('viewAny', PortalFooterLink::class);

        return PortalFooterLinkResource::collection(
            $portalContentService->paginateFooterLinks($request->query())
        );
    }

    public function store(UpsertPortalFooterLinkRequest $request, PortalContentService $portalContentService)
    {
        $link = $portalContentService->saveFooterLink(null, $request->validated(), $request->user()->tenant);

        return (new PortalFooterLinkResource($link))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(PortalFooterLink $portalFooterLink): PortalFooterLinkResource
    {
        $this->authorize('view', $portalFooterLink);

        return new PortalFooterLinkResource($portalFooterLink);
    }

    public function update(
        UpsertPortalFooterLinkRequest $request,
        PortalFooterLink $portalFooterLink,
        PortalContentService $portalContentService
    ): PortalFooterLinkResource {
        return new PortalFooterLinkResource(
            $portalContentService->saveFooterLink($portalFooterLink, $request->validated(), $request->user()->tenant)
        );
    }

    public function destroy(PortalFooterLink $portalFooterLink, PortalContentService $portalContentService): Response
    {
        $this->authorize('delete', $portalFooterLink);
        $portalContentService->delete($portalFooterLink);

        return response()->noContent();
    }
}
