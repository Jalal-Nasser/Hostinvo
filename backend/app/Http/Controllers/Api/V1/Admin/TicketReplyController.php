<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Support\StoreTicketReplyRequest;
use App\Http\Resources\Support\TicketResource;
use App\Models\Ticket;
use App\Services\Support\SupportService;

class TicketReplyController extends Controller
{
    public function store(
        StoreTicketReplyRequest $request,
        Ticket $ticket,
        SupportService $supportService
    ): TicketResource {
        return new TicketResource(
            $supportService->addReply($ticket, $request->validated(), $request->user())
        );
    }
}
