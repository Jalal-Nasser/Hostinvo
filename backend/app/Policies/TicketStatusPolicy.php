<?php

namespace App\Policies;

use App\Models\TicketStatus;
use App\Models\User;

class TicketStatusPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo(['tickets.view', 'tickets.manage', 'tickets.reply']);
    }

    public function view(User $user, TicketStatus $ticketStatus): bool
    {
        return $user->tenant_id === $ticketStatus->tenant_id
            && $user->hasPermissionTo(['tickets.view', 'tickets.manage', 'tickets.reply']);
    }
}
