<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(['tickets.view', 'tickets.manage']);
    }

    public function view(User $user, Ticket $ticket): bool
    {
        return $user->tenant_id === $ticket->tenant_id
            && $user->hasPermissionTo(['tickets.view', 'tickets.manage']);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo(['tickets.create', 'tickets.manage']);
    }

    public function update(User $user, Ticket $ticket): bool
    {
        return $user->tenant_id === $ticket->tenant_id
            && $user->hasPermissionTo('tickets.manage');
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        return $user->tenant_id === $ticket->tenant_id
            && $user->hasPermissionTo('tickets.manage');
    }

    public function reply(User $user, Ticket $ticket): bool
    {
        return $user->tenant_id === $ticket->tenant_id
            && $user->hasPermissionTo(['tickets.reply', 'tickets.manage']);
    }
}
