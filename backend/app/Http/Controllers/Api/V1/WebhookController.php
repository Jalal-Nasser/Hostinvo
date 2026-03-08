<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payments\HandleGatewayWebhookRequest;
use App\Payments\Exceptions\PaymentGatewayException;
use App\Services\Billing\PaymentService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class WebhookController extends Controller
{
    public function __invoke(
        HandleGatewayWebhookRequest $request,
        string $gateway,
        PaymentService $paymentService
    ): JsonResponse {
        try {
            $log = $paymentService->handleWebhook($gateway, $request);
        } catch (PaymentGatewayException) {
            return response()->json([
                'message' => 'Webhook verification failed.',
            ], Response::HTTP_BAD_REQUEST);
        }

        return response()->json([
            'data' => [
                'id' => $log->id,
                'gateway' => $log->gateway,
                'status' => $log->status,
            ],
        ]);
    }
}
