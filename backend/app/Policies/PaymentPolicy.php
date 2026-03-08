<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(['payments.view', 'payments.manage']);
    }

    public function view(User $user, Payment $payment): bool
    {
        return $user->tenant_id === $payment->tenant_id
            && $user->hasPermissionTo(['payments.view', 'payments.manage']);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('payments.manage');
    }
}
