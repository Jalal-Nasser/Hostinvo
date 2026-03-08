<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\Domains\DomainRenewalResource;
use App\Models\Domain;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DomainRenewalController extends Controller
{
    public function index(Domain $domain): AnonymousResourceCollection
    {
        $this->authorize('viewPortal', $domain);

        return DomainRenewalResource::collection(
            $domain->renewals()->latest('created_at')->get()
        );
    }
}
