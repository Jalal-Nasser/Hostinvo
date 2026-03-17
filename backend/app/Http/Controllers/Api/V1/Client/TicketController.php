<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Support\IndexTicketRequest;
use App\Http\Requests\Support\StorePortalTicketRequest;
use App\Http\Resources\Support\TicketResource;
use App\Models\Ticket;
use App\Services\Support\SupportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class TicketController extends Controller
{
    public function index(IndexTicketRequest $request, SupportService $supportService): AnonymousResourceCollection
    {
        return TicketResource::collection(
            $supportService->paginateTickets($request->validated(), $request->user())
        );
    }

    public function store(StorePortalTicketRequest $request, SupportService $supportService): JsonResponse
    {
        $ticket = $supportService->createTicketForPortal($request->validated(), $request->user());

        return (new TicketResource($ticket))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Ticket $ticket, SupportService $supportService): TicketResource
    {
        $this->authorize('view', $ticket);

        return new TicketResource(
            $supportService->getTicketForDisplay($ticket, request()->user())
        );
    }
}

