<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Support\IndexTicketDepartmentRequest;
use App\Http\Requests\Support\StoreTicketDepartmentRequest;
use App\Http\Requests\Support\UpdateTicketDepartmentRequest;
use App\Http\Resources\Support\TicketDepartmentResource;
use App\Models\TicketDepartment;
use App\Services\Support\SupportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class TicketDepartmentController extends Controller
{
    public function index(
        IndexTicketDepartmentRequest $request,
        SupportService $supportService
    ): AnonymousResourceCollection {
        return TicketDepartmentResource::collection(
            $supportService->paginateDepartments($request->validated(), $request->user())
        );
    }

    public function store(
        StoreTicketDepartmentRequest $request,
        SupportService $supportService
    ): JsonResponse {
        $department = $supportService->createDepartment($request->validated(), $request->user());

        return (new TicketDepartmentResource($department))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(TicketDepartment $ticketDepartment): TicketDepartmentResource
    {
        $this->authorize('view', $ticketDepartment);

        return new TicketDepartmentResource($ticketDepartment->loadCount('tickets'));
    }

    public function update(
        UpdateTicketDepartmentRequest $request,
        TicketDepartment $ticketDepartment,
        SupportService $supportService
    ): TicketDepartmentResource {
        return new TicketDepartmentResource(
            $supportService->updateDepartment($ticketDepartment, $request->validated(), $request->user())
                ->loadCount('tickets')
        );
    }

    public function destroy(TicketDepartment $ticketDepartment, SupportService $supportService): Response
    {
        $this->authorize('delete', $ticketDepartment);

        $supportService->deleteDepartment($ticketDepartment);

        return response()->noContent();
    }
}
