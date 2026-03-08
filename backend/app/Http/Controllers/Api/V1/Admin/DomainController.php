<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Domains\IndexDomainRequest;
use App\Http\Requests\Domains\UpsertDomainRequest;
use App\Http\Resources\Domains\DomainResource;
use App\Models\Domain;
use App\Services\Domains\DomainService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class DomainController extends Controller
{
    public function index(IndexDomainRequest $request, DomainService $domainService): AnonymousResourceCollection
    {
        return DomainResource::collection(
            $domainService->paginate($request->validated())
        );
    }

    public function store(UpsertDomainRequest $request, DomainService $domainService): JsonResponse
    {
        $domain = $domainService->create($request->validated(), $request->user());

        return (new DomainResource($domain))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Domain $domain, DomainService $domainService): DomainResource
    {
        $this->authorize('view', $domain);

        return new DomainResource(
            $domainService->getForDisplay($domain)
        );
    }

    public function update(UpsertDomainRequest $request, Domain $domain, DomainService $domainService): DomainResource
    {
        return new DomainResource(
            $domainService->update($domain, $request->validated(), $request->user())
        );
    }

    public function destroy(Domain $domain, DomainService $domainService): Response
    {
        $this->authorize('delete', $domain);

        $domainService->delete($domain);

        return response()->noContent();
    }
}
