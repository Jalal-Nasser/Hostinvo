<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Domains\IndexPortalDomainRequest;
use App\Http\Resources\Domains\DomainResource;
use App\Models\Domain;
use App\Services\Domains\DomainService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DomainController extends Controller
{
    public function index(IndexPortalDomainRequest $request, DomainService $domainService): AnonymousResourceCollection
    {
        return DomainResource::collection(
            $domainService->paginateForPortal($request->user(), $request->validated())
        );
    }

    public function show(Domain $domain, DomainService $domainService): DomainResource
    {
        $this->authorize('viewPortal', $domain);

        return new DomainResource(
            $domainService->getForPortalDisplay(request()->user(), $domain) ?? $domain
        );
    }
}
