<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Support\IndexTicketRequest;
use App\Http\Requests\Support\StoreTicketRequest;
use App\Http\Requests\Support\UpdateTicketRequest;
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

    public function store(StoreTicketRequest $request, SupportService $supportService): JsonResponse
    {
        $ticket = $supportService->createTicket($request->validated(), $request->user());

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

    public function update(
        UpdateTicketRequest $request,
        Ticket $ticket,
        SupportService $supportService
    ): TicketResource {
        return new TicketResource(
            $supportService->updateTicket($ticket, $request->validated(), $request->user())
        );
    }

    public function destroy(Ticket $ticket, SupportService $supportService): Response
    {
        $this->authorize('delete', $ticket);

        $supportService->deleteTicket($ticket);

        return response()->noContent();
    }
}
