<?php

namespace App\Services\Billing;

use App\Contracts\Repositories\Billing\InvoiceRepositoryInterface;
use App\Contracts\Repositories\Billing\PaymentRepositoryInterface;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(
        private readonly PaymentRepositoryInterface $payments,
        private readonly InvoiceRepositoryInterface $invoices,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->payments->paginate($filters);
    }

    public function record(Invoice $invoice, array $payload, User $actor): Payment
    {
        return DB::transaction(function () use ($invoice, $payload, $actor): Payment {
            if ($actor->tenant_id !== $invoice->tenant_id) {
                throw ValidationException::withMessages([
                    'invoice' => ['The selected invoice is invalid for the current tenant.'],
                ]);
            }

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

            Transaction::query()->create([
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

            if ($status === Payment::STATUS_COMPLETED) {
                $this->applyCompletedPaymentToInvoice($invoice, $payment);
            }

            return $payment->load(['client', 'invoice', 'transactions']);
        });
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
}
