<?php

namespace App\Policies;

use App\Models\ProductAddon;
use App\Models\User;

class ProductAddonPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(['products.view', 'products.manage']);
    }

    public function view(User $user, ProductAddon $productAddon): bool
    {
        return $user->tenant_id === $productAddon->tenant_id
            && $user->hasPermissionTo(['products.view', 'products.manage']);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('products.manage');
    }

    public function update(User $user, ProductAddon $productAddon): bool
    {
        return $user->tenant_id === $productAddon->tenant_id
            && $user->hasPermissionTo('products.manage');
    }

    public function delete(User $user, ProductAddon $productAddon): bool
    {
        return $user->tenant_id === $productAddon->tenant_id
            && $user->hasPermissionTo('products.manage');
    }
}
