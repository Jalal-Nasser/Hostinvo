<?php

namespace App\Payments\Drivers\PayPal;

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

class PayPalGateway implements PaymentGatewayInterface
{
    public function code(): string
    {
        return 'paypal';
    }

    public function createCheckout(
        Invoice $invoice,
        Payment $payment,
        Transaction $transaction,
        GatewayConfiguration $configuration,
        array $context
    ): GatewayCheckoutSession {
        $baseUrl = $this->baseUrl($configuration);
        $accessToken = $this->accessToken($configuration, $baseUrl);
        $payload = [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'reference_id' => $invoice->reference_number,
                'custom_id' => $payment->id,
                'invoice_id' => $invoice->reference_number,
                'description' => sprintf('Hostinvo invoice %s', $invoice->reference_number),
                'amount' => [
                    'currency_code' => strtoupper($invoice->currency),
                    'value' => number_format($invoice->balance_due_minor / 100, 2, '.', ''),
                ],
            ]],
            'payment_source' => [
                'paypal' => [
                    'experience_context' => [
                        'payment_method_preference' => 'IMMEDIATE_PAYMENT_REQUIRED',
                        'user_action' => 'PAY_NOW',
                        'shipping_preference' => 'NO_SHIPPING',
                        'return_url' => $context['success_url'],
                        'cancel_url' => $context['cancel_url'],
                    ],
                ],
            ],
        ];

        $response = Http::baseUrl($baseUrl)
            ->withToken($accessToken)
            ->acceptJson()
            ->post('/v2/checkout/orders', $payload);

        $this->throwIfFailed($response, 'PayPal order could not be created.');

        $data = $response->json();
        $orderId = $data['id'] ?? null;
        $approvalUrl = collect($data['links'] ?? [])
            ->firstWhere('rel', 'approve')['href'] ?? null;

        if (! is_string($orderId) || ! is_string($approvalUrl)) {
            throw new PaymentGatewayException('PayPal checkout response was incomplete.');
        }

        return new GatewayCheckoutSession(
            gateway: $this->code(),
            externalReference: $orderId,
            redirectUrl: $approvalUrl,
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
        $orderId = (string) ($context['order_id'] ?? '');

        if ($orderId === '') {
            throw new PaymentGatewayException('A PayPal order identifier is required to capture payment.');
        }

        $baseUrl = $this->baseUrl($configuration);
        $accessToken = $this->accessToken($configuration, $baseUrl);
        $response = Http::baseUrl($baseUrl)
            ->withToken($accessToken)
            ->acceptJson()
            ->post("/v2/checkout/orders/{$orderId}/capture");

        $this->throwIfFailed($response, 'PayPal payment could not be captured.');

        $data = $response->json();
        $status = (string) ($data['status'] ?? '');
        $capture = $data['purchase_units'][0]['payments']['captures'][0] ?? [];
        $captureId = is_string($capture['id'] ?? null) ? $capture['id'] : $orderId;
        $amountMinor = $this->decimalToMinor($capture['amount']['value'] ?? null);
        $currency = is_string($capture['amount']['currency_code'] ?? null)
            ? strtoupper($capture['amount']['currency_code'])
            : strtoupper($invoice->currency);

        if ($status !== 'COMPLETED') {
            return new GatewayWebhookPayload(
                gateway: $this->code(),
                eventType: 'paypal.capture.failed',
                paymentStatus: Payment::STATUS_FAILED,
                externalReference: $orderId,
                lookupReference: $orderId,
                reference: $captureId,
                amountMinor: $amountMinor,
                currency: $currency,
                occurredAt: now()->toIso8601String(),
                failureReason: 'PayPal returned a non-completed capture status.',
                payload: $data,
            );
        }

        return new GatewayWebhookPayload(
            gateway: $this->code(),
            eventType: 'paypal.capture.completed',
            paymentStatus: Payment::STATUS_COMPLETED,
            externalReference: $orderId,
            lookupReference: $orderId,
            reference: $captureId,
            amountMinor: $amountMinor,
            currency: $currency,
            occurredAt: now()->toIso8601String(),
            payload: $data,
        );
    }

    public function verifyWebhook(Request $request, GatewayConfiguration $configuration): GatewayWebhookPayload
    {
        $payload = $request->getContent();

        try {
            /** @var array<string, mixed> $event */
            $event = json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new PaymentGatewayException('PayPal webhook payload was invalid JSON.');
        }

        $baseUrl = $this->baseUrl($configuration);
        $accessToken = $this->accessToken($configuration, $baseUrl);
        $verificationPayload = [
            'auth_algo' => $request->header('paypal-auth-algo'),
            'cert_url' => $request->header('paypal-cert-url'),
            'transmission_id' => $request->header('paypal-transmission-id'),
            'transmission_sig' => $request->header('paypal-transmission-sig'),
            'transmission_time' => $request->header('paypal-transmission-time'),
            'webhook_id' => $configuration->credential('webhook_id'),
            'webhook_event' => $event,
        ];

        $response = Http::baseUrl($baseUrl)
            ->withToken($accessToken)
            ->acceptJson()
            ->post('/v1/notifications/verify-webhook-signature', $verificationPayload);

        $this->throwIfFailed($response, 'PayPal webhook signature could not be verified.');

        if (($response->json('verification_status') ?? null) !== 'SUCCESS') {
            throw new PaymentGatewayException('PayPal webhook signature verification failed.');
        }

        $eventType = (string) ($event['event_type'] ?? 'unknown');
        $resource = is_array($event['resource'] ?? null) ? $event['resource'] : [];
        $relatedIds = is_array($resource['supplementary_data']['related_ids'] ?? null)
            ? $resource['supplementary_data']['related_ids']
            : [];
        $externalReference = $relatedIds['order_id'] ?? $resource['id'] ?? null;
        $reference = is_string($resource['id'] ?? null) ? $resource['id'] : null;
        $amountMinor = $this->decimalToMinor($resource['amount']['value'] ?? null);
        $currency = is_string($resource['amount']['currency_code'] ?? null)
            ? strtoupper($resource['amount']['currency_code'])
            : null;
        $paymentStatus = match ($eventType) {
            'PAYMENT.CAPTURE.COMPLETED' => Payment::STATUS_COMPLETED,
            'PAYMENT.CAPTURE.DENIED', 'PAYMENT.CAPTURE.DECLINED' => Payment::STATUS_FAILED,
            'CHECKOUT.ORDER.APPROVED' => Payment::STATUS_PENDING,
            default => Payment::STATUS_PENDING,
        };

        return new GatewayWebhookPayload(
            gateway: $this->code(),
            eventType: $eventType,
            paymentStatus: $paymentStatus,
            externalReference: is_string($externalReference) ? $externalReference : null,
            lookupReference: is_string($externalReference) ? $externalReference : null,
            reference: $reference,
            amountMinor: $amountMinor,
            currency: $currency,
            occurredAt: is_string($event['create_time'] ?? null) ? $event['create_time'] : now()->toIso8601String(),
            failureReason: $paymentStatus === Payment::STATUS_FAILED
                ? 'PayPal reported the payment capture as failed.'
                : null,
            payload: $event,
        );
    }

    private function accessToken(GatewayConfiguration $configuration, string $baseUrl): string
    {
        $response = Http::baseUrl($baseUrl)
            ->asForm()
            ->withBasicAuth(
                (string) $configuration->credential('client_id'),
                (string) $configuration->credential('client_secret')
            )
            ->acceptJson()
            ->post('/v1/oauth2/token', [
                'grant_type' => 'client_credentials',
            ]);

        $this->throwIfFailed($response, 'PayPal access token could not be requested.');

        $token = $response->json('access_token');

        if (! is_string($token) || $token === '') {
            throw new PaymentGatewayException('PayPal access token response was incomplete.');
        }

        return $token;
    }

    private function baseUrl(GatewayConfiguration $configuration): string
    {
        $mode = (string) $configuration->option('mode', 'sandbox');
        $baseUrls = $configuration->option('base_urls', []);
        $resolved = $baseUrls[$mode] ?? $baseUrls['sandbox'] ?? null;

        if (! is_string($resolved) || $resolved === '') {
            throw new PaymentGatewayException('PayPal base URL configuration is missing.');
        }

        return rtrim($resolved, '/');
    }

    private function decimalToMinor(mixed $value): ?int
    {
        if (! is_string($value) && ! is_numeric($value)) {
            return null;
        }

        $normalized = number_format((float) $value, 2, '.', '');
        [$whole, $decimal] = explode('.', $normalized);

        return (((int) $whole) * 100) + (int) $decimal;
    }

    private function throwIfFailed(Response $response, string $message): void
    {
        if ($response->successful()) {
            return;
        }

        $body = $response->json();
        $gatewayMessage = $body['message'] ?? $body['error_description'] ?? null;

        throw new PaymentGatewayException(
            is_string($gatewayMessage) ? $gatewayMessage : $message
        );
    }
}
