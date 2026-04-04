<?php

namespace App\Policies;

use App\Models\PortalFooterLink;
use App\Models\User;
use App\Policies\Concerns\ManagesTenantAdministration;

class PortalFooterLinkPolicy
{
    use ManagesTenantAdministration;

    public function viewAny(User $user): bool
    {
        return $this->canManageTenantAdministration($user);
    }

    public function view(User $user, PortalFooterLink $portalFooterLink): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $portalFooterLink);
    }

    public function create(User $user): bool
    {
        return $this->canManageTenantAdministration($user);
    }

    public function update(User $user, PortalFooterLink $portalFooterLink): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $portalFooterLink);
    }

    public function delete(User $user, PortalFooterLink $portalFooterLink): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $portalFooterLink);
    }
}
