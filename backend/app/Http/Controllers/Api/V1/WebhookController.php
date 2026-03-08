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
            return $this->failure(
                message: 'Webhook verification failed.',
                status: Response::HTTP_BAD_REQUEST,
            );
        }

        return $this->success([
            'id' => $log->id,
            'gateway' => $log->gateway,
            'status' => $log->status,
        ]);
    }
}
