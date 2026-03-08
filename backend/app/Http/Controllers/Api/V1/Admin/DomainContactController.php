<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Domains\SyncDomainContactsRequest;
use App\Http\Resources\Domains\DomainContactResource;
use App\Http\Resources\Domains\DomainResource;
use App\Models\Domain;
use App\Services\Domains\DomainService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DomainContactController extends Controller
{
    public function index(Domain $domain): AnonymousResourceCollection
    {
        $this->authorize('view', $domain);

        return DomainContactResource::collection(
            $domain->contacts()->orderBy('type')->get()
        );
    }

    public function update(
        SyncDomainContactsRequest $request,
        Domain $domain,
        DomainService $domainService
    ): DomainResource {
        return new DomainResource(
            $domainService->syncContacts($domain, $request->validated(), $request->user())
        );
    }
}
