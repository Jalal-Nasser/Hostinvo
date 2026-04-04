<?php

namespace App\Policies;

use App\Models\Service;
use App\Models\User;

class ServicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(['services.view', 'services.manage']);
    }

    public function view(User $user, Service $service): bool
    {
        return $user->tenant_id === $service->tenant_id
            && $user->hasPermissionTo(['services.view', 'services.manage']);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('services.manage');
    }

    public function update(User $user, Service $service): bool
    {
        return $user->tenant_id === $service->tenant_id
            && $user->hasPermissionTo('services.manage');
    }

    public function delete(User $user, Service $service): bool
    {
        return $user->tenant_id === $service->tenant_id
            && $user->hasPermissionTo('services.manage');
    }

    public function dispatchProvisioning(User $user, Service $service): bool
    {
        return $user->tenant_id === $service->tenant_id
            && $user->hasPermissionTo('provisioning.manage');
    }

    public function viewPortal(User $user, Service $service): bool
    {
        return $user->tenant_id === $service->tenant_id
            && $user->hasPermissionTo('client.portal.access')
            && $this->portalOwnsService($user, $service);
    }

    private function portalOwnsService(User $user, Service $service): bool
    {
        if ($service->relationLoaded('client')) {
            return $service->client?->user_id === $user->id;
        }

        return $service->client()->where('user_id', $user->id)->exists();
    }
}
