<?php

namespace App\Policies;

use App\Models\ProvisioningJob;
use App\Models\User;

class ProvisioningJobPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(['provisioning.view', 'provisioning.manage']);
    }

    public function view(User $user, ProvisioningJob $job): bool
    {
        return $user->tenant_id === $job->tenant_id
            && $user->hasPermissionTo(['provisioning.view', 'provisioning.manage']);
    }
}
