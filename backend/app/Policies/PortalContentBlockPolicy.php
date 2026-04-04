<?php

namespace App\Policies;

use App\Models\PortalContentBlock;
use App\Models\User;
use App\Policies\Concerns\ManagesTenantAdministration;

class PortalContentBlockPolicy
{
    use ManagesTenantAdministration;

    public function viewAny(User $user): bool
    {
        return $this->canManageTenantAdministration($user);
    }

    public function view(User $user, PortalContentBlock $portalContentBlock): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $portalContentBlock);
    }

    public function create(User $user): bool
    {
        return $this->canManageTenantAdministration($user);
    }

    public function update(User $user, PortalContentBlock $portalContentBlock): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $portalContentBlock);
    }

    public function delete(User $user, PortalContentBlock $portalContentBlock): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $portalContentBlock);
    }
}
