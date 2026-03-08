<?php

namespace App\Payments\DataTransferObjects;

class GatewayCheckoutSession
{
    public function __construct(
        public readonly string $gateway,
        public readonly string $externalReference,
        public readonly string $redirectUrl,
        public readonly array $requestPayload = [],
        public readonly array $responsePayload = [],
    ) {
    }
}
