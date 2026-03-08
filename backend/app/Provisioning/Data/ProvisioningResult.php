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
    ) {
    }

    public static function success(
        string $message,
        array $requestPayload = [],
        array $responsePayload = [],
        array $serviceAttributes = []
    ): self {
        return new self(
            successful: true,
            status: 'completed',
            message: $message,
            requestPayload: $requestPayload,
            responsePayload: $responsePayload,
            serviceAttributes: $serviceAttributes,
        );
    }

    public static function placeholder(
        string $message,
        array $requestPayload = [],
        array $responsePayload = [],
        array $serviceAttributes = []
    ): self {
        return new self(
            successful: true,
            status: 'placeholder',
            message: $message,
            requestPayload: $requestPayload,
            responsePayload: $responsePayload,
            serviceAttributes: $serviceAttributes,
        );
    }

    public static function failure(
        string $message,
        array $requestPayload = [],
        array $responsePayload = [],
        array $serviceAttributes = []
    ): self {
        return new self(
            successful: false,
            status: 'failed',
            message: $message,
            requestPayload: $requestPayload,
            responsePayload: $responsePayload,
            serviceAttributes: $serviceAttributes,
        );
    }
}
