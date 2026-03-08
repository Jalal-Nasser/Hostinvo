<?php

namespace App\Provisioning\Exceptions;

use RuntimeException;
use Throwable;

class ProvisioningException extends RuntimeException
{
    public function __construct(
        string $message,
        private readonly array $requestPayload = [],
        private readonly array $responsePayload = [],
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }

    public function requestPayload(): array
    {
        return $this->requestPayload;
    }

    public function responsePayload(): array
    {
        return $this->responsePayload;
    }
}
