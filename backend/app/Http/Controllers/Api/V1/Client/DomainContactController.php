<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Domains\PortalSyncDomainContactsRequest;
use App\Http\Resources\Domains\DomainContactResource;
use App\Http\Resources\Domains\DomainResource;
use App\Models\Domain;
use App\Services\Domains\DomainService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DomainContactController extends Controller
{
    public function index(Domain $domain): AnonymousResourceCollection
    {
        $this->authorize('viewPortal', $domain);

        return DomainContactResource::collection(
            $domain->contacts()->orderBy('type')->get()
        );
    }

    public function update(
        PortalSyncDomainContactsRequest $request,
        Domain $domain,
        DomainService $domainService
    ): DomainResource {
        return new DomainResource(
            $domainService->syncContacts($domain, $request->validated(), $request->user(), 'portal')
        );
    }
}
