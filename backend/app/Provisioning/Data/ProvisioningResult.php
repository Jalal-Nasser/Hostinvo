<?php

namespace App\Provisioning\Data;

readonly class ProvisioningResult
{
    public function __construct(
        public bool $successful,
        public string $status,
        public string $message,
        public array $requestPayload = [],
        public array $responsePayload = [],
        public array $serviceAttributes = [],
        public array $operationPayload = [],
    ) {
    }

    public static function success(
        string $message,
        array $requestPayload = [],
        array $responsePayload = [],
        array $serviceAttributes = [],
        array $operationPayload = [],
    ): self {
        return new self(
            successful: true,
            status: 'completed',
            message: $message,
            requestPayload: $requestPayload,
            responsePayload: $responsePayload,
            serviceAttributes: $serviceAttributes,
            operationPayload: $operationPayload,
        );
    }

    public static function placeholder(
        string $message,
        array $requestPayload = [],
        array $responsePayload = [],
        array $serviceAttributes = [],
        array $operationPayload = [],
    ): self {
        return new self(
            successful: true,
            status: 'placeholder',
            message: $message,
            requestPayload: $requestPayload,
            responsePayload: $responsePayload,
            serviceAttributes: $serviceAttributes,
            operationPayload: $operationPayload,
        );
    }

    public static function failure(
        string $message,
        array $requestPayload = [],
        array $responsePayload = [],
        array $serviceAttributes = [],
        array $operationPayload = [],
    ): self {
        return new self(
            successful: false,
            status: 'failed',
            message: $message,
            requestPayload: $requestPayload,
            responsePayload: $responsePayload,
            serviceAttributes: $serviceAttributes,
            operationPayload: $operationPayload,
        );
    }
}
