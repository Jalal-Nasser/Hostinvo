<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(['invoices.view', 'invoices.manage']);
    }

    public function view(User $user, Invoice $invoice): bool
    {
        return $user->tenant_id === $invoice->tenant_id
            && $user->hasPermissionTo(['invoices.view', 'invoices.manage']);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('invoices.manage');
    }

    public function update(User $user, Invoice $invoice): bool
    {
        return $user->tenant_id === $invoice->tenant_id
            && $user->hasPermissionTo('invoices.manage');
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        return $user->tenant_id === $invoice->tenant_id
            && $user->hasPermissionTo('invoices.manage');
    }

    public function viewPortal(User $user, Invoice $invoice): bool
    {
        return $user->tenant_id === $invoice->tenant_id
            && $user->hasPermissionTo('client.portal.access')
            && $this->portalOwnsInvoice($user, $invoice);
    }

    private function portalOwnsInvoice(User $user, Invoice $invoice): bool
    {
        if ($invoice->relationLoaded('client')) {
            return $invoice->client?->user_id === $user->id;
        }

        return $invoice->client()->where('user_id', $user->id)->exists();
    }
}
