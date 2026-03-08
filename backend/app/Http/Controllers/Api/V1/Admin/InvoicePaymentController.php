<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\RecordInvoicePaymentRequest;
use App\Http\Resources\Billing\PaymentResource;
use App\Models\Invoice;
use App\Services\Billing\PaymentService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class InvoicePaymentController extends Controller
{
    public function store(
        RecordInvoicePaymentRequest $request,
        Invoice $invoice,
        PaymentService $paymentService
    ): JsonResponse {
        $this->authorize('view', $invoice);

        $payment = $paymentService->record($invoice, $request->validated(), $request->user());

        return (new PaymentResource($payment))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}
