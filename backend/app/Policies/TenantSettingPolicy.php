<?php

namespace App\Policies;

use App\Models\TenantSetting;
use App\Models\User;
use App\Policies\Concerns\ManagesTenantAdministration;

class TenantSettingPolicy
{
    use ManagesTenantAdministration;

    public function viewAny(User $user): bool
    {
        return $this->canManageTenantAdministration($user);
    }

    public function view(User $user, TenantSetting $tenantSetting): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $tenantSetting);
    }

    public function create(User $user): bool
    {
        return $this->canManageTenantAdministration($user);
    }

    public function update(User $user, TenantSetting $tenantSetting): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $tenantSetting);
    }
}
