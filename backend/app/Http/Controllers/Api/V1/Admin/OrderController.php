<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Orders\IndexOrderRequest;
use App\Http\Requests\Orders\PlaceExistingOrderRequest;
use App\Http\Requests\Orders\StoreOrderRequest;
use App\Http\Requests\Orders\UpdateOrderRequest;
use App\Http\Resources\Orders\OrderResource;
use App\Models\Order;
use App\Services\Orders\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class OrderController extends Controller
{
    public function index(IndexOrderRequest $request, OrderService $orderService): AnonymousResourceCollection
    {
        return OrderResource::collection(
            $orderService->paginate($request->validated())
        );
    }

    public function store(StoreOrderRequest $request, OrderService $orderService): JsonResponse
    {
        $order = $orderService->create($request->validated(), $request->user());

        return (new OrderResource($order))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Order $order, OrderService $orderService): OrderResource
    {
        $this->authorize('view', $order);

        return new OrderResource(
            $orderService->getForDisplay($order)
        );
    }

    public function update(
        UpdateOrderRequest $request,
        Order $order,
        OrderService $orderService
    ): OrderResource {
        return new OrderResource(
            $orderService->update($order, $request->validated(), $request->user())
        );
    }

    public function destroy(Order $order, OrderService $orderService): Response
    {
        $this->authorize('delete', $order);

        $orderService->delete($order);

        return response()->noContent();
    }

    public function place(
        PlaceExistingOrderRequest $request,
        Order $order,
        OrderService $orderService
    ): OrderResource {
        return new OrderResource(
            $orderService->placeExisting($order, $request->user())
        );
    }
}
