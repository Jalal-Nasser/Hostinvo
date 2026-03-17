<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Support\StorePortalTicketReplyRequest;
use App\Http\Resources\Support\TicketResource;
use App\Models\Ticket;
use App\Services\Support\SupportService;

class TicketReplyController extends Controller
{
    public function store(
        StorePortalTicketReplyRequest $request,
        Ticket $ticket,
        SupportService $supportService
    ): TicketResource {
        return new TicketResource(
            $supportService->addReply($ticket, $request->validated(), $request->user())
        );
    }
}

