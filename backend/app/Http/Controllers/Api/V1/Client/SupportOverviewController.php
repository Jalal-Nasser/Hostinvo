<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\Support\TicketDepartmentResource;
use App\Http\Resources\Support\TicketResource;
use App\Http\Resources\Support\TicketStatusResource;
use App\Models\Ticket;
use App\Services\Support\SupportService;
use Illuminate\Http\JsonResponse;

class SupportOverviewController extends Controller
{
    public function __invoke(SupportService $supportService): JsonResponse
    {
        $this->authorize('viewAny', Ticket::class);

        $overview = $supportService->getOverview(request()->user());

        return $this->success([
            'stats' => $overview['stats'],
            'departments' => TicketDepartmentResource::collection($overview['departments'])->resolve(),
            'statuses' => TicketStatusResource::collection($overview['statuses'])->resolve(),
            'recent_tickets' => TicketResource::collection($overview['recent_tickets'])->resolve(),
        ]);
    }
}

