<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Portal\UpsertAnnouncementRequest;
use App\Http\Resources\Portal\AnnouncementResource;
use App\Models\Announcement;
use App\Services\Portal\PortalContentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class AnnouncementController extends Controller
{
    public function index(Request $request, PortalContentService $portalContentService): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Announcement::class);

        return AnnouncementResource::collection(
            $portalContentService->paginateAnnouncements($request->query())
        );
    }

    public function store(UpsertAnnouncementRequest $request, PortalContentService $portalContentService)
    {
        $announcement = $portalContentService->saveAnnouncement(null, $request->validated(), $request->user()->tenant);

        return (new AnnouncementResource($announcement))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Announcement $announcement): AnnouncementResource
    {
        $this->authorize('view', $announcement);

        return new AnnouncementResource($announcement);
    }

    public function update(UpsertAnnouncementRequest $request, Announcement $announcement, PortalContentService $portalContentService): AnnouncementResource
    {
        return new AnnouncementResource(
            $portalContentService->saveAnnouncement($announcement, $request->validated(), $request->user()->tenant)
        );
    }

    public function destroy(Announcement $announcement, PortalContentService $portalContentService): Response
    {
        $this->authorize('delete', $announcement);
        $portalContentService->delete($announcement);

        return response()->noContent();
    }
}
