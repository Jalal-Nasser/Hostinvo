<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(['orders.view', 'orders.manage']);
    }

    public function view(User $user, Order $order): bool
    {
        return $user->tenant_id === $order->tenant_id
            && $user->hasPermissionTo(['orders.view', 'orders.manage']);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('orders.manage');
    }

    public function update(User $user, Order $order): bool
    {
        return $user->tenant_id === $order->tenant_id
            && $user->hasPermissionTo('orders.manage');
    }

    public function delete(User $user, Order $order): bool
    {
        return $user->tenant_id === $order->tenant_id
            && $user->hasPermissionTo('orders.manage');
    }

    public function place(User $user, Order $order): bool
    {
        return $user->tenant_id === $order->tenant_id
            && $user->hasPermissionTo('orders.manage');
    }
}
