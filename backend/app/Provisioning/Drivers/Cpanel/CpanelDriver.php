<?php

namespace App\Provisioning\Drivers\Cpanel;

use App\Provisioning\Contracts\ProvisioningDriverInterface;
use App\Provisioning\Data\ProvisioningContext;
use App\Provisioning\Data\ProvisioningResult;

class CpanelDriver implements ProvisioningDriverInterface
{
    public function code(): string
    {
        return 'cpanel';
    }

    public function label(): string
    {
        return 'cPanel / WHM';
    }

    public function createAccount(ProvisioningContext $context): ProvisioningResult
    {
        return $this->placeholder($context, 'create_account');
    }

    public function suspendAccount(ProvisioningContext $context): ProvisioningResult
    {
        return $this->placeholder($context, 'suspend_account');
    }

    public function unsuspendAccount(ProvisioningContext $context): ProvisioningResult
    {
        return $this->placeholder($context, 'unsuspend_account');
    }

    public function terminateAccount(ProvisioningContext $context): ProvisioningResult
    {
        return $this->placeholder($context, 'terminate_account');
    }

    public function changePackage(ProvisioningContext $context): ProvisioningResult
    {
        return $this->placeholder($context, 'change_package');
    }

    public function resetPassword(ProvisioningContext $context): ProvisioningResult
    {
        return $this->placeholder($context, 'reset_password');
    }

    public function syncUsage(ProvisioningContext $context): ProvisioningResult
    {
        return $this->placeholder($context, 'sync_usage');
    }

    public function syncServiceStatus(ProvisioningContext $context): ProvisioningResult
    {
        return $this->placeholder($context, 'sync_service_status');
    }

    private function placeholder(ProvisioningContext $context, string $operation): ProvisioningResult
    {
        return ProvisioningResult::placeholder(
            message: "cPanel placeholder driver executed {$operation} without calling the external API.",
            requestPayload: [
                'operation' => $operation,
                'service_id' => $context->service->id,
                'server_id' => $context->server->id,
                'server_package_id' => $context->serverPackage?->id,
                'payload' => $context->payload,
            ],
            responsePayload: [
                'driver' => $this->code(),
                'label' => $this->label(),
                'placeholder' => true,
                'executed_at' => now()->toIso8601String(),
            ],
        );
    }
}
