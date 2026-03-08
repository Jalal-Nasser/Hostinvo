<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Orders\PlaceOrderRequest;
use App\Http\Requests\Orders\ReviewOrderRequest;
use App\Http\Resources\Orders\OrderResource;
use App\Http\Resources\Orders\OrderReviewResource;
use App\Services\Orders\OrderService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class OrderCheckoutController extends Controller
{
    public function review(ReviewOrderRequest $request, OrderService $orderService): OrderReviewResource
    {
        return new OrderReviewResource(
            $orderService->review($request->validated(), $request->user())
        );
    }

    public function place(PlaceOrderRequest $request, OrderService $orderService): JsonResponse
    {
        $order = $orderService->place($request->validated(), $request->user());

        return (new OrderResource($order))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}
