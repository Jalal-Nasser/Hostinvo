<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\Support\TicketDepartmentResource;
use App\Services\Support\SupportService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TicketDepartmentController extends Controller
{
    public function index(Request $request, SupportService $supportService): AnonymousResourceCollection
    {
        abort_unless(
            $request->user()->hasPermissionTo(['tickets.view', 'tickets.create']) &&
            $request->user()->hasPermissionTo('client.portal.access'),
            403
        );

        return TicketDepartmentResource::collection(
            $supportService->listDepartments($request->user(), true)
        );
    }
}

