<?php

namespace App\Models\Concerns;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Collection;

trait HasRoles
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)->withTimestamps();
    }

    public function permissions(): Collection
    {
        return $this->roles
            ->loadMissing('permissions')
            ->flatMap(fn (Role $role) => $role->permissions)
            ->unique('id')
            ->values();
    }

    public function hasRole(string|array $roles): bool
    {
        $roleNames = collect((array) $roles);

        return $this->roles->contains(
            fn (Role $role) => $roleNames->contains($role->name)
        );
    }

    public function hasPermissionTo(string|array $permissions): bool
    {
        $permissionNames = collect((array) $permissions);

        return $this->permissions()->contains(
            fn (Permission $permission) => $permissionNames->contains($permission->name)
        );
    }

    public function assignRole(Role|string $role): void
    {
        $roleId = $role instanceof Role
            ? $role->getKey()
            : Role::query()->where('name', $role)->value('id');

        if ($roleId) {
            $this->roles()->syncWithoutDetaching([$roleId]);
        }
    }
}
