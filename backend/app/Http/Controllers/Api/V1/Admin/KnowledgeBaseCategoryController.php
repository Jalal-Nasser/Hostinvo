<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Portal\UpsertKnowledgeBaseCategoryRequest;
use App\Http\Resources\Portal\KnowledgeBaseCategoryResource;
use App\Models\KnowledgeBaseCategory;
use App\Services\Portal\PortalContentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class KnowledgeBaseCategoryController extends Controller
{
    public function index(Request $request, PortalContentService $portalContentService): AnonymousResourceCollection
    {
        $this->authorize('viewAny', KnowledgeBaseCategory::class);

        return KnowledgeBaseCategoryResource::collection(
            $portalContentService->paginateKnowledgeBaseCategories($request->query())
        );
    }

    public function store(UpsertKnowledgeBaseCategoryRequest $request, PortalContentService $portalContentService)
    {
        $category = $portalContentService->saveKnowledgeBaseCategory(null, $request->validated(), $request->user()->tenant);

        return (new KnowledgeBaseCategoryResource($category))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(KnowledgeBaseCategory $knowledgebaseCategory): KnowledgeBaseCategoryResource
    {
        $this->authorize('view', $knowledgebaseCategory);

        return new KnowledgeBaseCategoryResource($knowledgebaseCategory);
    }

    public function update(
        UpsertKnowledgeBaseCategoryRequest $request,
        KnowledgeBaseCategory $knowledgebaseCategory,
        PortalContentService $portalContentService
    ): KnowledgeBaseCategoryResource {
        return new KnowledgeBaseCategoryResource(
            $portalContentService->saveKnowledgeBaseCategory($knowledgebaseCategory, $request->validated(), $request->user()->tenant)
        );
    }

    public function destroy(KnowledgeBaseCategory $knowledgebaseCategory, PortalContentService $portalContentService): Response
    {
        $this->authorize('delete', $knowledgebaseCategory);
        $portalContentService->delete($knowledgebaseCategory);

        return response()->noContent();
    }
}
