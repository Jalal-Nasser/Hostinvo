<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\IndexPaymentRequest;
use App\Http\Resources\Billing\PaymentResource;
use App\Services\Billing\PaymentService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PaymentController extends Controller
{
    public function index(IndexPaymentRequest $request, PaymentService $paymentService): AnonymousResourceCollection
    {
        return PaymentResource::collection(
            $paymentService->paginate($request->validated())
        );
    }
}
