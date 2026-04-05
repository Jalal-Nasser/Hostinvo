<?php

namespace App\Services\Billing;

use App\Contracts\Repositories\Auth\TenantRepositoryInterface;
use App\Contracts\Repositories\Billing\InvoiceRepositoryInterface;
use App\Contracts\Repositories\Billing\PaymentRepositoryInterface;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\Transaction;
use App\Models\User;
use App\Models\WebhookLog;
use App\Services\Notifications\NotificationDispatchService;
use App\Services\Notifications\NotificationEventCatalog;
use App\Payments\DataTransferObjects\GatewayCheckoutSession;
use App\Payments\DataTransferObjects\GatewayConfiguration;
use App\Payments\DataTransferObjects\GatewayWebhookPayload;
use App\Payments\Exceptions\PaymentGatewayException;
use App\Payments\PaymentGatewayManager;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(
        private readonly PaymentRepositoryInterface $payments,
        private readonly InvoiceRepositoryInterface $invoices,
        private readonly TenantRepositoryInterface $tenants,
        private readonly PaymentGatewayManager $gateways,
        private readonly NotificationDispatchService $notifications,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->payments->paginate($filters);
    }

    public function record(Invoice $invoice, array $payload, User $actor): Payment
    {
        $this->guardActorCanAccessInvoice($invoice, $actor);

        return DB::transaction(function () use ($invoice, $payload, $actor): Payment {
            if ($invoice->status === Invoice::STATUS_CANCELLED) {
                throw ValidationException::withMessages([
                    'invoice' => ['Payments cannot be recorded against a cancelled invoice.'],
                ]);
            }

            $type = (string) ($payload['type'] ?? Payment::TYPE_PAYMENT);
            $status = (string) ($payload['status'] ?? Payment::STATUS_COMPLETED);
            $amountMinor = (int) $payload['amount_minor'];

            if ($status === Payment::STATUS_COMPLETED) {
                $this->guardCompletedPaymentAmount($invoice, $type, $amountMinor);
            }

            $payment = $this->payments->create([
                'tenant_id' => $invoice->tenant_id,
                'invoice_id' => $invoice->id,
                'client_id' => $invoice->client_id,
                'user_id' => $actor->id,
                'type' => $type,
                'status' => $status,
                'payment_method' => $payload['payment_method'],
                'currency' => $payload['currency'] ?? $invoice->currency,
                'amount_minor' => $amountMinor,
                'reference' => $payload['reference'] ?? null,
                'paid_at' => $payload['paid_at'] ?? now(),
                'notes' => $payload['notes'] ?? null,
                'metadata' => $payload['metadata'] ?? null,
            ]);

            $transaction = new Transaction();
            $transaction->forceFill([
                'tenant_id' => $invoice->tenant_id,
                'payment_id' => $payment->id,
                'invoice_id' => $invoice->id,
                'client_id' => $invoice->client_id,
                'type' => $type,
                'status' => $status,
                'gateway' => $payload['gateway'] ?? 'manual',
                'external_reference' => $payload['external_reference'] ?? ($payload['reference'] ?? null),
                'currency' => $payment->currency,
                'amount_minor' => $payment->amount_minor,
                'occurred_at' => $payload['paid_at'] ?? now(),
                'request_payload' => $payload['request_payload'] ?? null,
                'response_payload' => $payload['response_payload'] ?? null,
            ]);
            $transaction->save();

            if ($status === Payment::STATUS_COMPLETED) {
                $this->applyCompletedPaymentToInvoice($invoice->fresh(), $payment->fresh());
            }

            $resolvedPayment = $payment->load(['client', 'invoice', 'transactions']);

            if ($status === Payment::STATUS_COMPLETED) {
                $this->dispatchPaymentReceiptNotification($resolvedPayment);
            }

            return $resolvedPayment;
        });
    }

    public function availableGatewayOptions(Invoice $invoice, User $actor): array
    {
        $this->guardActorCanAccessInvoice($invoice, $actor);

        if ($invoice->balance_due_minor < 1 || in_array($invoice->status, [
            Invoice::STATUS_PAID,
            Invoice::STATUS_CANCELLED,
            Invoice::STATUS_REFUNDED,
        ], true)) {
            return [];
        }

        return array_map(
            fn (GatewayConfiguration $configuration) => $configuration->toArray(),
            $this->gateways->availableForTenant($this->tenantForInvoice($invoice, $actor))
        );
    }

    public function createGatewayCheckout(Invoice $invoice, array $payload, User $actor): array
    {
        $this->guardActorCanAccessInvoice($invoice, $actor);
        $this->guardInvoiceEligibleForGatewayPayment($invoice);

        $gateway = (string) $payload['gateway'];
        $tenant = $this->tenantForInvoice($invoice, $actor);
        $configuration = $this->gateways->configurationForTenant($tenant, $gateway);

        if (! $configuration->usable()) {
            throw ValidationException::withMessages([
                'gateway' => ['The requested payment gateway is not configured for this tenant.'],
            ]);
        }

        try {
            return DB::transaction(function () use ($invoice, $payload, $gateway, $actor, $configuration): array {
                $invoice->loadMissing('client');

                $payment = $this->payments->create([
                    'tenant_id' => $invoice->tenant_id,
                    'invoice_id' => $invoice->id,
                    'client_id' => $invoice->client_id,
                    'user_id' => $actor->id,
                    'type' => Payment::TYPE_PAYMENT,
                    'status' => Payment::STATUS_PENDING,
                    'payment_method' => $gateway,
                    'currency' => $invoice->currency,
                    'amount_minor' => $invoice->balance_due_minor,
                    'reference' => null,
                    'paid_at' => null,
                    'notes' => null,
                    'metadata' => [
                        'gateway' => $gateway,
                        'flow' => 'checkout',
                    ],
                ]);

                $transaction = new Transaction();
                $transaction->forceFill([
                    'tenant_id' => $invoice->tenant_id,
                    'payment_id' => $payment->id,
                    'invoice_id' => $invoice->id,
                    'client_id' => $invoice->client_id,
                    'type' => Payment::TYPE_PAYMENT,
                    'status' => Payment::STATUS_PENDING,
                    'gateway' => $gateway,
                    'external_reference' => null,
                    'currency' => $invoice->currency,
                    'amount_minor' => $invoice->balance_due_minor,
                    'occurred_at' => now(),
                    'request_payload' => [
                        'success_url' => $payload['success_url'],
                        'cancel_url' => $payload['cancel_url'],
                    ],
                    'response_payload' => null,
                ]);
                $transaction->save();

                $checkout = $this->gateways->resolve($gateway)->createCheckout(
                    $invoice,
                    $payment,
                    $transaction,
                    $configuration,
                    [
                        'success_url' => $payload['success_url'],
                        'cancel_url' => $payload['cancel_url'],
                    ],
                );

                $this->syncCheckoutArtifacts($payment, $transaction, $checkout);

                return [
                    'payment' => $payment->fresh(['client', 'invoice', 'transactions']),
                    'transaction' => $transaction->fresh(),
                    'checkout' => $checkout,
                ];
            });
        } catch (PaymentGatewayException $exception) {
            throw ValidationException::withMessages([
                'gateway' => [$exception->getMessage()],
            ]);
        }
    }

    public function capturePayPalCheckout(Invoice $invoice, array $payload, User $actor): Payment
    {
        $this->guardActorCanAccessInvoice($invoice, $actor);

        $transaction = Transaction::query()
            ->with(['payment.invoice'])
            ->where('tenant_id', $invoice->tenant_id)
            ->where('invoice_id', $invoice->id)
            ->where('gateway', 'paypal')
            ->where('external_reference', $payload['order_id'])
            ->latest('created_at')
            ->first();

        if (! $transaction || ! $transaction->payment) {
            throw ValidationException::withMessages([
                'order_id' => ['The PayPal checkout session could not be found for this invoice.'],
            ]);
        }

        $payment = $transaction->payment;

        if ($payment->status === Payment::STATUS_COMPLETED) {
            return $payment->load(['client', 'invoice', 'transactions']);
        }

        $configuration = $this->gateways->configurationForTenant(
            $this->tenantForInvoice($invoice, $actor),
            'paypal',
        );

        try {
            $result = $this->gateways->resolve('paypal')->completeCheckout(
                $invoice,
                $payment,
                $transaction,
                $configuration,
                $payload,
            );

            return $this->applyGatewayOutcome($payment, $transaction, $result);
        } catch (PaymentGatewayException $exception) {
            $this->markGatewayPaymentFailed($payment, $transaction, 'paypal.capture.failed', $exception->getMessage(), [
                'capture_context' => $payload,
            ]);

            throw ValidationException::withMessages([
                'order_id' => [$exception->getMessage()],
            ]);
        }
    }

    public function handleWebhook(string $gateway, Request $request): WebhookLog
    {
        if (! $this->gateways->supports($gateway)) {
            throw new PaymentGatewayException('The requested payment gateway is not configured.');
        }

        $driver = $this->gateways->resolve($gateway);
        $matchedTenant = null;
        $matchedPayload = null;

        foreach ($this->tenants->allActive() as $tenant) {
            $configuration = $this->gateways->configurationForTenant($tenant, $gateway);

            if (! $configuration->usable()) {
                continue;
            }

            try {
                $matchedPayload = $driver->verifyWebhook($request, $configuration);
                $matchedTenant = $tenant;

                break;
            } catch (PaymentGatewayException) {
                continue;
            }
        }

        $log = WebhookLog::query()->create([
            'tenant_id' => $matchedTenant?->id,
            'gateway' => $gateway,
            'event_type' => $matchedPayload?->eventType,
            'status' => $matchedPayload ? WebhookLog::STATUS_RECEIVED : WebhookLog::STATUS_REJECTED,
            'external_reference' => $matchedPayload?->lookupReference ?? $matchedPayload?->externalReference,
            'signature' => $this->webhookSignature($request, $gateway),
            'request_headers' => $request->headers->all(),
            'payload' => $this->decodedWebhookPayload($request),
            'processed_at' => $matchedPayload ? null : now(),
            'error_message' => $matchedPayload ? null : 'Webhook signature verification failed for all active tenant gateway configurations.',
        ]);

        if (! $matchedTenant || ! $matchedPayload) {
            throw new PaymentGatewayException('Webhook verification failed.');
        }

        $transaction = $this->findWebhookTransaction($gateway, $matchedTenant, $matchedPayload);

        if (! $transaction || ! $transaction->payment) {
            $log->forceFill([
                'status' => WebhookLog::STATUS_IGNORED,
                'processed_at' => now(),
                'error_message' => 'Verified webhook event did not match an existing tenant transaction.',
            ])->save();

            return $log->fresh();
        }

        if ($matchedPayload->isCompleted() || $matchedPayload->isFailed() || $matchedPayload->isCancelled()) {
            try {
                $this->applyGatewayOutcome($transaction->payment, $transaction, $matchedPayload);
            } catch (\Throwable $throwable) {
                $log->forceFill([
                    'status' => WebhookLog::STATUS_FAILED,
                    'processed_at' => now(),
                    'error_message' => $throwable->getMessage(),
                ])->save();

                throw $throwable;
            }
        } else {
            $transaction->forceFill([
                'status' => $matchedPayload->paymentStatus,
                'occurred_at' => $matchedPayload->occurredAt ?? now(),
                'response_payload' => [
                    'event_type' => $matchedPayload->eventType,
                    'event_payload' => $matchedPayload->payload,
                ],
            ])->save();
        }

        $log->forceFill([
            'status' => WebhookLog::STATUS_PROCESSED,
            'processed_at' => now(),
            'error_message' => null,
        ])->save();

        return $log->fresh();
    }

    private function guardActorCanAccessInvoice(Invoice $invoice, User $actor): void
    {
        if ($actor->hasRole(Role::SUPER_ADMIN)) {
            return;
        }

        if ($actor->tenant_id !== $invoice->tenant_id) {
            throw ValidationException::withMessages([
                'invoice' => ['The selected invoice is invalid for the current tenant.'],
            ]);
        }
    }

    private function guardInvoiceEligibleForGatewayPayment(Invoice $invoice): void
    {
        if ($invoice->balance_due_minor < 1) {
            throw ValidationException::withMessages([
                'invoice' => ['This invoice does not have an outstanding balance to collect.'],
            ]);
        }

        if (in_array($invoice->status, [
            Invoice::STATUS_PAID,
            Invoice::STATUS_CANCELLED,
            Invoice::STATUS_REFUNDED,
        ], true)) {
            throw ValidationException::withMessages([
                'invoice' => ['This invoice is not eligible for a new payment gateway checkout flow.'],
            ]);
        }
    }

    private function tenantForInvoice(Invoice $invoice, User $actor): Tenant
    {
        if ($actor->tenant_id === $invoice->tenant_id && $actor->relationLoaded('tenant') && $actor->tenant) {
            return $actor->tenant;
        }

        return $this->tenants->findById($invoice->tenant_id)
            ?? throw ValidationException::withMessages([
                'invoice' => ['The invoice tenant could not be resolved.'],
            ]);
    }

    private function syncCheckoutArtifacts(
        Payment $payment,
        Transaction $transaction,
        GatewayCheckoutSession $checkout
    ): void {
        $transaction->forceFill([
            'external_reference' => $checkout->externalReference,
            'request_payload' => $checkout->requestPayload,
            'response_payload' => $checkout->responsePayload,
        ])->save();

        $payment->forceFill([
            'metadata' => array_merge($payment->metadata ?? [], [
                'gateway' => $checkout->gateway,
                'checkout_url' => $checkout->redirectUrl,
                'external_reference' => $checkout->externalReference,
            ]),
        ])->save();
    }

    private function applyGatewayOutcome(
        Payment $payment,
        Transaction $transaction,
        GatewayWebhookPayload $payload
    ): Payment {
        return DB::transaction(function () use ($payment, $transaction, $payload): Payment {
            $wasCompleted = $payment->status === Payment::STATUS_COMPLETED;

            if ($payment->status === Payment::STATUS_COMPLETED && $payload->isCompleted()) {
                $this->syncGatewayResponse($payment, $transaction, $payload);

                return $payment->fresh(['client', 'invoice', 'transactions']);
            }

            $this->syncGatewayResponse($payment, $transaction, $payload);

            if ($payload->isCompleted()) {
                $invoice = $payment->invoice()->firstOrFail();
                $this->guardCompletedPaymentAmount($invoice, $payment->type, $payment->amount_minor);
                $this->applyCompletedPaymentToInvoice($invoice, $payment->fresh());
            }

            $resolvedPayment = $payment->fresh(['client', 'invoice', 'transactions']);

            if ($payload->isCompleted() && ! $wasCompleted) {
                $this->dispatchPaymentReceiptNotification($resolvedPayment);
            }

            return $resolvedPayment;
        });
    }

    private function syncGatewayResponse(
        Payment $payment,
        Transaction $transaction,
        GatewayWebhookPayload $payload
    ): void {
        $occurredAt = $payload->occurredAt ?? now()->toIso8601String();
        $paymentStatus = $payload->isCompleted() && $payment->status === Payment::STATUS_COMPLETED
            ? Payment::STATUS_COMPLETED
            : $payload->paymentStatus;

        $transaction->forceFill([
            'status' => $paymentStatus,
            'external_reference' => $payload->lookupReference ?? $payload->externalReference ?? $transaction->external_reference,
            'occurred_at' => $occurredAt,
            'response_payload' => [
                'event_type' => $payload->eventType,
                'gateway_reference' => $payload->reference,
                'failure_reason' => $payload->failureReason,
                'event_payload' => $payload->payload,
            ],
        ])->save();

        $payment->forceFill([
            'status' => $paymentStatus,
            'payment_method' => $payload->gateway,
            'currency' => $payload->currency ?? $payment->currency,
            'reference' => $payload->reference ?? $payment->reference ?? $transaction->external_reference,
            'paid_at' => $payload->isCompleted() ? ($payment->paid_at ?? $occurredAt) : $payment->paid_at,
            'metadata' => array_merge($payment->metadata ?? [], [
                'gateway' => $payload->gateway,
                'event_type' => $payload->eventType,
                'failure_reason' => $payload->failureReason,
            ]),
        ])->save();
    }

    private function markGatewayPaymentFailed(
        Payment $payment,
        Transaction $transaction,
        string $eventType,
        string $message,
        array $payload = []
    ): void {
        $transaction->forceFill([
            'status' => Payment::STATUS_FAILED,
            'occurred_at' => now(),
            'response_payload' => [
                'event_type' => $eventType,
                'failure_reason' => $message,
                'event_payload' => $payload,
            ],
        ])->save();

        $payment->forceFill([
            'status' => Payment::STATUS_FAILED,
            'metadata' => array_merge($payment->metadata ?? [], [
                'failure_reason' => $message,
                'event_type' => $eventType,
            ]),
        ])->save();
    }

    private function findWebhookTransaction(
        string $gateway,
        Tenant $tenant,
        GatewayWebhookPayload $payload
    ): ?Transaction {
        if ($payload->paymentId) {
            return Transaction::query()
                ->with('payment')
                ->where('tenant_id', $tenant->id)
                ->where('gateway', $gateway)
                ->where('payment_id', $payload->paymentId)
                ->latest('created_at')
                ->first();
        }

        $references = array_values(array_filter([
            $payload->lookupReference,
            $payload->externalReference,
            $payload->reference,
        ]));

        if ($references === []) {
            return null;
        }

        return Transaction::query()
            ->with('payment')
            ->where('tenant_id', $tenant->id)
            ->where('gateway', $gateway)
            ->whereIn('external_reference', $references)
            ->latest('created_at')
            ->first();
    }

    private function webhookSignature(Request $request, string $gateway): ?string
    {
        return match ($gateway) {
            'stripe' => $request->header('Stripe-Signature'),
            'paypal' => $request->header('paypal-transmission-sig'),
            default => null,
        };
    }

    private function decodedWebhookPayload(Request $request): array
    {
        $decoded = json_decode($request->getContent(), true);

        return is_array($decoded) ? $decoded : ['raw' => $request->getContent()];
    }

    private function guardCompletedPaymentAmount(Invoice $invoice, string $type, int $amountMinor): void
    {
        if (in_array($type, [Payment::TYPE_PAYMENT, Payment::TYPE_CREDIT], true)) {
            if ($amountMinor > $invoice->balance_due_minor) {
                throw ValidationException::withMessages([
                    'amount_minor' => ['The payment amount cannot exceed the current invoice balance.'],
                ]);
            }

            return;
        }

        $refundableAmount = max($invoice->amount_paid_minor - $invoice->refunded_amount_minor, 0);

        if ($amountMinor > $refundableAmount) {
            throw ValidationException::withMessages([
                'amount_minor' => ['The refund amount cannot exceed the refundable payment balance.'],
            ]);
        }
    }

    private function applyCompletedPaymentToInvoice(Invoice $invoice, Payment $payment): void
    {
        $amountPaidMinor = $invoice->amount_paid_minor;
        $refundedAmountMinor = $invoice->refunded_amount_minor;

        if (in_array($payment->type, [Payment::TYPE_PAYMENT, Payment::TYPE_CREDIT], true)) {
            $amountPaidMinor += $payment->amount_minor;
        }

        if ($payment->type === Payment::TYPE_REFUND) {
            $refundedAmountMinor += $payment->amount_minor;
        }

        $status = Invoice::STATUS_UNPAID;

        if ($refundedAmountMinor > 0 && $refundedAmountMinor >= max($amountPaidMinor, $invoice->total_minor)) {
            $status = Invoice::STATUS_REFUNDED;
        } elseif ($amountPaidMinor >= $invoice->total_minor) {
            $status = Invoice::STATUS_PAID;
        } elseif ($invoice->due_date && now()->startOfDay()->gt($invoice->due_date->copy()->startOfDay())) {
            $status = Invoice::STATUS_OVERDUE;
        }

        $this->invoices->update($invoice, [
            'status' => $status,
            'amount_paid_minor' => $amountPaidMinor,
            'refunded_amount_minor' => $refundedAmountMinor,
            'balance_due_minor' => max($invoice->total_minor - $amountPaidMinor, 0),
            'paid_at' => $amountPaidMinor > 0 ? ($invoice->paid_at ?? $payment->paid_at ?? now()) : null,
            'refunded_at' => $refundedAmountMinor > 0 ? ($invoice->refunded_at ?? $payment->paid_at ?? now()) : null,
        ]);
    }

    private function dispatchPaymentReceiptNotification(Payment $payment): void
    {
        if ($payment->type !== Payment::TYPE_PAYMENT || $payment->status !== Payment::STATUS_COMPLETED) {
            return;
        }

        $payment->loadMissing(['client', 'invoice']);
        $client = $payment->client;
        $invoice = $payment->invoice;

        if (! $client || ! $invoice || ! filled($client->email)) {
            return;
        }

        $tenant = $this->tenants->findById($payment->tenant_id);

        if (! $tenant) {
            return;
        }

        $this->notifications->send(
            email: $client->email,
            event: NotificationEventCatalog::EVENT_PAYMENT_RECEIPT,
            context: [
                'client' => [
                    'name' => $client->display_name,
                    'email' => $client->email,
                ],
                'invoice' => [
                    'reference_number' => $invoice->reference_number,
                    'total' => number_format($invoice->total_minor / 100, 2).' '.$invoice->currency,
                ],
                'payment' => [
                    'amount' => number_format($payment->amount_minor / 100, 2).' '.$payment->currency,
                    'reference' => $payment->reference,
                    'method' => $payment->payment_method,
                ],
            ],
            tenant: $tenant,
            locale: $client->preferred_locale ?: $tenant->default_locale,
        );
    }
}
