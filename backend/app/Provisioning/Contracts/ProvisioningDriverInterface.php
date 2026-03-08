<?php

namespace App\Provisioning\Contracts;

use App\Provisioning\Data\ProvisioningContext;
use App\Provisioning\Data\ProvisioningResult;

interface ProvisioningDriverInterface
{
    public function code(): string;

    public function label(): string;

    public function createAccount(ProvisioningContext $context): ProvisioningResult;

    public function suspendAccount(ProvisioningContext $context): ProvisioningResult;

    public function unsuspendAccount(ProvisioningContext $context): ProvisioningResult;

    public function terminateAccount(ProvisioningContext $context): ProvisioningResult;

    public function changePackage(ProvisioningContext $context): ProvisioningResult;

    public function resetPassword(ProvisioningContext $context): ProvisioningResult;

    public function syncUsage(ProvisioningContext $context): ProvisioningResult;

    public function syncServiceStatus(ProvisioningContext $context): ProvisioningResult;
}
