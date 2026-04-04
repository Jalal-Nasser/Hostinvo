<?php

namespace App\Policies;

use App\Models\KnowledgeBaseCategory;
use App\Models\User;
use App\Policies\Concerns\ManagesTenantAdministration;

class KnowledgeBaseCategoryPolicy
{
    use ManagesTenantAdministration;

    public function viewAny(User $user): bool
    {
        return $this->canManageTenantAdministration($user);
    }

    public function view(User $user, KnowledgeBaseCategory $category): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $category);
    }

    public function create(User $user): bool
    {
        return $this->canManageTenantAdministration($user);
    }

    public function update(User $user, KnowledgeBaseCategory $category): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $category);
    }

    public function delete(User $user, KnowledgeBaseCategory $category): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $category);
    }
}
