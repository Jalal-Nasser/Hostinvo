<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Support\IndexTicketStatusRequest;
use App\Http\Resources\Support\TicketStatusResource;
use App\Services\Support\SupportService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TicketStatusController extends Controller
{
    public function index(IndexTicketStatusRequest $request, SupportService $supportService): AnonymousResourceCollection
    {
        return TicketStatusResource::collection(
            $supportService->listStatuses($request->user())
        );
    }
}
