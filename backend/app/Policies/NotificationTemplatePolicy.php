<?php

namespace App\Policies;

use App\Models\NotificationTemplate;
use App\Models\User;
use App\Policies\Concerns\ManagesTenantAdministration;

class NotificationTemplatePolicy
{
    use ManagesTenantAdministration;

    public function viewAny(User $user): bool
    {
        return $this->canManageTenantAdministration($user);
    }

    public function view(User $user, NotificationTemplate $notificationTemplate): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $notificationTemplate);
    }

    public function create(User $user): bool
    {
        return $this->canManageTenantAdministration($user);
    }

    public function update(User $user, NotificationTemplate $notificationTemplate): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $notificationTemplate);
    }
}
