<?php

namespace App\Policies;

use App\Models\NetworkIncident;
use App\Models\User;
use App\Policies\Concerns\ManagesTenantAdministration;

class NetworkIncidentPolicy
{
    use ManagesTenantAdministration;

    public function viewAny(User $user): bool
    {
        return $this->canManageTenantAdministration($user);
    }

    public function view(User $user, NetworkIncident $networkIncident): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $networkIncident);
    }

    public function create(User $user): bool
    {
        return $this->canManageTenantAdministration($user);
    }

    public function update(User $user, NetworkIncident $networkIncident): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $networkIncident);
    }

    public function delete(User $user, NetworkIncident $networkIncident): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $networkIncident);
    }
}
