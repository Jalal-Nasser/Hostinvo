<?php

namespace App\Policies;

use App\Models\TicketDepartment;
use App\Models\User;

class TicketDepartmentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(['ticket_departments.view', 'ticket_departments.manage', 'tickets.manage']);
    }

    public function view(User $user, TicketDepartment $ticketDepartment): bool
    {
        return $user->tenant_id === $ticketDepartment->tenant_id
            && $user->hasPermissionTo(['ticket_departments.view', 'ticket_departments.manage', 'tickets.manage']);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo(['ticket_departments.manage', 'tickets.manage']);
    }

    public function update(User $user, TicketDepartment $ticketDepartment): bool
    {
        return $user->tenant_id === $ticketDepartment->tenant_id
            && $user->hasPermissionTo(['ticket_departments.manage', 'tickets.manage']);
    }

    public function delete(User $user, TicketDepartment $ticketDepartment): bool
    {
        return $user->tenant_id === $ticketDepartment->tenant_id
            && $user->hasPermissionTo(['ticket_departments.manage', 'tickets.manage']);
    }
}
