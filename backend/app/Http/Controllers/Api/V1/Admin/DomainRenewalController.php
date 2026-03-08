<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Domains\StoreDomainRenewalRequest;
use App\Http\Resources\Domains\DomainRenewalResource;
use App\Models\Domain;
use App\Services\Domains\DomainService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class DomainRenewalController extends Controller
{
    public function index(Domain $domain): AnonymousResourceCollection
    {
        $this->authorize('view', $domain);

        return DomainRenewalResource::collection(
            $domain->renewals()->latest('created_at')->get()
        );
    }

    public function store(
        StoreDomainRenewalRequest $request,
        Domain $domain,
        DomainService $domainService
    ): JsonResponse {
        $renewal = $domainService->addRenewal($domain, $request->validated(), $request->user());

        return (new DomainRenewalResource($renewal))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}
