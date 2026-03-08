<?php

namespace App\Payments\Contracts;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Transaction;
use App\Payments\DataTransferObjects\GatewayCheckoutSession;
use App\Payments\DataTransferObjects\GatewayConfiguration;
use App\Payments\DataTransferObjects\GatewayWebhookPayload;
use Illuminate\Http\Request;

interface PaymentGatewayInterface
{
    public function code(): string;

    public function createCheckout(
        Invoice $invoice,
        Payment $payment,
        Transaction $transaction,
        GatewayConfiguration $configuration,
        array $context
    ): GatewayCheckoutSession;

    public function completeCheckout(
        Invoice $invoice,
        Payment $payment,
        Transaction $transaction,
        GatewayConfiguration $configuration,
        array $context
    ): GatewayWebhookPayload;

    public function verifyWebhook(Request $request, GatewayConfiguration $configuration): GatewayWebhookPayload;
}
