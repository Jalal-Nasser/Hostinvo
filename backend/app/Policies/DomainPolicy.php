<?php

namespace App\Policies;

use App\Models\Domain;
use App\Models\User;

class DomainPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(['domains.view', 'domains.manage']);
    }

    public function view(User $user, Domain $domain): bool
    {
        return $user->tenant_id === $domain->tenant_id
            && $user->hasPermissionTo(['domains.view', 'domains.manage']);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('domains.manage');
    }

    public function update(User $user, Domain $domain): bool
    {
        return $user->tenant_id === $domain->tenant_id
            && $user->hasPermissionTo('domains.manage');
    }

    public function delete(User $user, Domain $domain): bool
    {
        return $user->tenant_id === $domain->tenant_id
            && $user->hasPermissionTo('domains.manage');
    }

    public function viewPortal(User $user, Domain $domain): bool
    {
        return $user->tenant_id === $domain->tenant_id
            && $user->hasPermissionTo('client.portal.access')
            && $this->portalOwnsDomain($user, $domain);
    }

    public function managePortalContacts(User $user, Domain $domain): bool
    {
        return $this->viewPortal($user, $domain);
    }

    private function portalOwnsDomain(User $user, Domain $domain): bool
    {
        // Use the already-loaded relationship to avoid a redundant DB query
        // on every authorization check (viewPortal and managePortalContacts).
        if ($domain->relationLoaded('client')) {
            return $domain->client?->user_id === $user->id;
        }

        return $domain->client()->where('user_id', $user->id)->exists();
    }
}
