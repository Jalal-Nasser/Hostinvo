<?php

namespace App\Policies;

use App\Models\Announcement;
use App\Models\User;
use App\Policies\Concerns\ManagesTenantAdministration;

class AnnouncementPolicy
{
    use ManagesTenantAdministration;

    public function viewAny(User $user): bool
    {
        return $this->canManageTenantAdministration($user);
    }

    public function view(User $user, Announcement $announcement): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $announcement);
    }

    public function create(User $user): bool
    {
        return $this->canManageTenantAdministration($user);
    }

    public function update(User $user, Announcement $announcement): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $announcement);
    }

    public function delete(User $user, Announcement $announcement): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $announcement);
    }
}
