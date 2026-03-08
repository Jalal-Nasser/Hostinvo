<?php

namespace App\Payments\DataTransferObjects;

use App\Models\Payment;

class GatewayWebhookPayload
{
    public function __construct(
        public readonly string $gateway,
        public readonly string $eventType,
        public readonly string $paymentStatus,
        public readonly ?string $externalReference = null,
        public readonly ?string $paymentId = null,
        public readonly ?string $lookupReference = null,
        public readonly ?string $reference = null,
        public readonly ?int $amountMinor = null,
        public readonly ?string $currency = null,
        public readonly ?string $occurredAt = null,
        public readonly ?string $failureReason = null,
        public readonly array $payload = [],
    ) {
    }

    public function isCompleted(): bool
    {
        return $this->paymentStatus === Payment::STATUS_COMPLETED;
    }

    public function isFailed(): bool
    {
        return $this->paymentStatus === Payment::STATUS_FAILED;
    }

    public function isCancelled(): bool
    {
        return $this->paymentStatus === Payment::STATUS_CANCELLED;
    }
}
