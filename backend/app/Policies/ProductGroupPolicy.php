<?php

namespace App\Policies;

use App\Models\ProductGroup;
use App\Models\User;

class ProductGroupPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(['product_groups.view', 'product_groups.manage']);
    }

    public function view(User $user, ProductGroup $group): bool
    {
        return $user->tenant_id === $group->tenant_id
            && $user->hasPermissionTo(['product_groups.view', 'product_groups.manage']);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('product_groups.manage');
    }

    public function update(User $user, ProductGroup $group): bool
    {
        return $user->tenant_id === $group->tenant_id
            && $user->hasPermissionTo('product_groups.manage');
    }

    public function delete(User $user, ProductGroup $group): bool
    {
        return $user->tenant_id === $group->tenant_id
            && $user->hasPermissionTo('product_groups.manage');
    }
}
