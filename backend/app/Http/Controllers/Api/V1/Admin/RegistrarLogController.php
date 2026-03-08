<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Domains\RegistrarLogResource;
use App\Models\Domain;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RegistrarLogController extends Controller
{
    public function index(Domain $domain): AnonymousResourceCollection
    {
        $this->authorize('view', $domain);

        return RegistrarLogResource::collection(
            $domain->registrarLogs()->latest('created_at')->get()
        );
    }
}
