<?php

namespace App\Policies;

use App\Models\KnowledgeBaseArticle;
use App\Models\User;
use App\Policies\Concerns\ManagesTenantAdministration;

class KnowledgeBaseArticlePolicy
{
    use ManagesTenantAdministration;

    public function viewAny(User $user): bool
    {
        return $this->canManageTenantAdministration($user);
    }

    public function view(User $user, KnowledgeBaseArticle $article): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $article);
    }

    public function create(User $user): bool
    {
        return $this->canManageTenantAdministration($user);
    }

    public function update(User $user, KnowledgeBaseArticle $article): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $article);
    }

    public function delete(User $user, KnowledgeBaseArticle $article): bool
    {
        return $this->canManageTenantAdministration($user)
            && $this->ownsTenantResource($user, $article);
    }
}
