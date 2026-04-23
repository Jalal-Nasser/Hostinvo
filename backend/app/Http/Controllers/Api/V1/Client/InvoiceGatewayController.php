<?php

namespace App\Http\Controllers\Api\V1\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payments\CapturePayPalCheckoutRequest;
use App\Http\Requests\Payments\CreateGatewayCheckoutRequest;
use App\Http\Resources\Billing\PaymentResource;
use App\Models\Invoice;
use App\Services\Billing\PaymentService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class InvoiceGatewayController extends Controller
{
    public function index(Invoice $invoice, PaymentService $paymentService): JsonResponse
    {
        $this->authorize('viewPortal', $invoice);

        return $this->success(
            $paymentService->availableGatewayOptions($invoice, request()->user())
        );
    }

    public function store(
        CreateGatewayCheckoutRequest $request,
        Invoice $invoice,
        PaymentService $paymentService
    ): JsonResponse {
        $this->authorize('viewPortal', $invoice);

        $checkout = $paymentService->createGatewayCheckout($invoice, $request->validated(), $request->user());

        return $this->success([
            'gateway' => $request->validated('gateway'),
            'redirect_url' => $checkout['checkout']->redirectUrl,
            'external_reference' => $checkout['checkout']->externalReference,
            'payment' => (new PaymentResource($checkout['payment']))->resolve($request),
        ], status: Response::HTTP_CREATED);
    }

    public function capturePayPal(
        CapturePayPalCheckoutRequest $request,
        Invoice $invoice,
        PaymentService $paymentService
    ): JsonResponse {
        $this->authorize('viewPortal', $invoice);

        $payment = $paymentService->capturePayPalCheckout($invoice, $request->validated(), $request->user());

        return (new PaymentResource($payment))
            ->response()
            ->setStatusCode(Response::HTTP_OK);
    }
}
