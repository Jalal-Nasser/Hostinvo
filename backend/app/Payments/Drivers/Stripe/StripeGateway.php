<?php

namespace App\Payments\Drivers\Stripe;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Transaction;
use App\Payments\Contracts\PaymentGatewayInterface;
use App\Payments\DataTransferObjects\GatewayCheckoutSession;
use App\Payments\DataTransferObjects\GatewayConfiguration;
use App\Payments\DataTransferObjects\GatewayWebhookPayload;
use App\Payments\Exceptions\PaymentGatewayException;
use Illuminate\Http\Client\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use JsonException;

class StripeGateway implements PaymentGatewayInterface
{
    public function code(): string
    {
        return 'stripe';
    }

    public function createCheckout(
        Invoice $invoice,
        Payment $payment,
        Transaction $transaction,
        GatewayConfiguration $configuration,
        array $context
    ): GatewayCheckoutSession {
        $payload = [
            'mode' => 'payment',
            'success_url' => $context['success_url'],
            'cancel_url' => $context['cancel_url'],
            'client_reference_id' => $payment->id,
            'customer_email' => $invoice->client?->email,
            'line_items[0][price_data][currency]' => strtolower($invoice->currency),
            'line_items[0][price_data][product_data][name]' => sprintf('Invoice %s', $invoice->reference_number),
            'line_items[0][price_data][product_data][description]' => sprintf(
                'Hostinvo invoice payment for %s',
                $invoice->reference_number
            ),
            'line_items[0][price_data][unit_amount]' => $invoice->balance_due_minor,
            'line_items[0][quantity]' => 1,
            'metadata[payment_id]' => $payment->id,
            'metadata[invoice_id]' => $invoice->id,
            'metadata[tenant_id]' => $invoice->tenant_id,
            'payment_intent_data[metadata][payment_id]' => $payment->id,
            'payment_intent_data[metadata][invoice_id]' => $invoice->id,
            'payment_intent_data[metadata][tenant_id]' => $invoice->tenant_id,
        ];

        $response = Http::baseUrl(rtrim((string) $configuration->option('base_url'), '/'))
            ->asForm()
            ->withToken((string) $configuration->credential('secret_key'))
            ->acceptJson()
            ->post('/v1/checkout/sessions', $payload);

        $this->throwIfFailed($response, 'Stripe checkout session could not be created.');

        $data = $response->json();
        $checkoutUrl = $data['url'] ?? null;
        $sessionId = $data['id'] ?? null;

        if (! is_string($checkoutUrl) || ! is_string($sessionId)) {
            throw new PaymentGatewayException('Stripe checkout session response was incomplete.');
        }

        return new GatewayCheckoutSession(
            gateway: $this->code(),
            externalReference: $sessionId,
            redirectUrl: $checkoutUrl,
            requestPayload: $payload,
            responsePayload: $data,
        );
    }

    public function completeCheckout(
        Invoice $invoice,
        Payment $payment,
        Transaction $transaction,
        GatewayConfiguration $configuration,
        array $context
    ): GatewayWebhookPayload {
        throw new PaymentGatewayException('Stripe checkout is finalized via webhooks only.');
    }

    public function verifyWebhook(Request $request, GatewayConfiguration $configuration): GatewayWebhookPayload
    {
        $signature = (string) $request->header('Stripe-Signature');
        $payload = $request->getContent();
        $secret = $configuration->credential('webhook_secret');

        if ($signature === '' || $secret === null) {
            throw new PaymentGatewayException('Stripe webhook signature could not be verified.');
        }

        $this->guardSignature($payload, $signature, $secret);

        try {
            /** @var array<string, mixed> $event */
            $event = json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new PaymentGatewayException('Stripe webhook payload was invalid JSON.');
        }

        $eventType = (string) ($event['type'] ?? 'unknown');
        $object = is_array($event['data']['object'] ?? null) ? $event['data']['object'] : [];
        $metadata = is_array($object['metadata'] ?? null) ? $object['metadata'] : [];
        $paymentId = is_string($metadata['payment_id'] ?? null) ? $metadata['payment_id'] : null;
        $externalReference = is_string($object['id'] ?? null) ? $object['id'] : null;
        $reference = is_string($object['payment_intent'] ?? null)
            ? $object['payment_intent']
            : $externalReference;
        $amountMinor = is_numeric($object['amount_total'] ?? null)
            ? (int) $object['amount_total']
            : (is_numeric($object['amount'] ?? null) ? (int) $object['amount'] : null);
        $currency = is_string($object['currency'] ?? null) ? strtoupper($object['currency']) : null;
        $occurredAt = isset($event['created']) ? now()->setTimestamp((int) $event['created'])->toIso8601String() : null;

        $paymentStatus = match ($eventType) {
            'checkout.session.completed' => Payment::STATUS_COMPLETED,
            'checkout.session.expired' => Payment::STATUS_CANCELLED,
            'checkout.session.async_payment_failed', 'payment_intent.payment_failed' => Payment::STATUS_FAILED,
            default => Payment::STATUS_PENDING,
        };

        $failureReason = $paymentStatus === Payment::STATUS_FAILED
            ? 'Stripe reported the checkout session or payment intent as failed.'
            : null;

        return new GatewayWebhookPayload(
            gateway: $this->code(),
            eventType: $eventType,
            paymentStatus: $paymentStatus,
            externalReference: $externalReference,
            paymentId: $paymentId,
            lookupReference: $externalReference,
            reference: $reference,
            amountMinor: $amountMinor,
            currency: $currency,
            occurredAt: $occurredAt,
            failureReason: $failureReason,
            payload: $event,
        );
    }

    private function guardSignature(string $payload, string $signature, string $secret): void
    {
        $timestamp = null;
        $signatures = [];

        foreach (explode(',', $signature) as $segment) {
            [$key, $value] = array_pad(explode('=', trim($segment), 2), 2, null);

            if ($key === 't') {
                $timestamp = $value;
            }

            if ($key === 'v1' && is_string($value)) {
                $signatures[] = $value;
            }
        }

        if (! is_string($timestamp) || $signatures === []) {
            throw new PaymentGatewayException('Stripe webhook signature was malformed.');
        }

        $signedPayload = sprintf('%s.%s', $timestamp, $payload);
        $expected = hash_hmac('sha256', $signedPayload, $secret);

        foreach ($signatures as $candidate) {
            if (hash_equals($expected, $candidate)) {
                return;
            }
        }

        throw new PaymentGatewayException('Stripe webhook signature did not match the configured secret.');
    }

    private function throwIfFailed(Response $response, string $message): void
    {
        if ($response->successful()) {
            return;
        }

        $body = $response->json();
        $gatewayMessage = $body['error']['message'] ?? $body['message'] ?? null;

        throw new PaymentGatewayException(
            is_string($gatewayMessage) ? $gatewayMessage : $message
        );
    }
}
