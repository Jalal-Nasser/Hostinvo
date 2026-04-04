<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Portal\UpsertKnowledgeBaseArticleRequest;
use App\Http\Resources\Portal\KnowledgeBaseArticleResource;
use App\Models\KnowledgeBaseArticle;
use App\Services\Portal\PortalContentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class KnowledgeBaseArticleController extends Controller
{
    public function index(Request $request, PortalContentService $portalContentService): AnonymousResourceCollection
    {
        $this->authorize('viewAny', KnowledgeBaseArticle::class);

        return KnowledgeBaseArticleResource::collection(
            $portalContentService->paginateKnowledgeBaseArticles($request->query())
        );
    }

    public function store(UpsertKnowledgeBaseArticleRequest $request, PortalContentService $portalContentService)
    {
        $article = $portalContentService->saveKnowledgeBaseArticle(null, $request->validated(), $request->user()->tenant);

        return (new KnowledgeBaseArticleResource($article))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(KnowledgeBaseArticle $knowledgebaseArticle): KnowledgeBaseArticleResource
    {
        $this->authorize('view', $knowledgebaseArticle);

        return new KnowledgeBaseArticleResource($knowledgebaseArticle->loadMissing('category'));
    }

    public function update(
        UpsertKnowledgeBaseArticleRequest $request,
        KnowledgeBaseArticle $knowledgebaseArticle,
        PortalContentService $portalContentService
    ): KnowledgeBaseArticleResource {
        return new KnowledgeBaseArticleResource(
            $portalContentService->saveKnowledgeBaseArticle($knowledgebaseArticle, $request->validated(), $request->user()->tenant)
        );
    }

    public function destroy(KnowledgeBaseArticle $knowledgebaseArticle, PortalContentService $portalContentService): Response
    {
        $this->authorize('delete', $knowledgebaseArticle);
        $portalContentService->delete($knowledgebaseArticle);

        return response()->noContent();
    }
}
