<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function viewAny(User $user): bool
    {
        if ($this->isSupportStaff($user)) {
            return $user->hasPermissionTo(['tickets.view', 'tickets.manage']);
        }

        return $user->hasPermissionTo('tickets.view')
            && $user->hasPermissionTo('client.portal.access')
            && $this->hasPortalClient($user);
    }

    public function view(User $user, Ticket $ticket): bool
    {
        if ($user->tenant_id !== $ticket->tenant_id) {
            return false;
        }

        if ($this->isSupportStaff($user)) {
            return $user->hasPermissionTo(['tickets.view', 'tickets.manage']);
        }

        return $user->hasPermissionTo('tickets.view')
            && $user->hasPermissionTo('client.portal.access')
            && $this->portalOwnsTicket($user, $ticket);
    }

    public function create(User $user): bool
    {
        if ($this->isSupportStaff($user)) {
            return $user->hasPermissionTo(['tickets.create', 'tickets.manage']);
        }

        return $user->hasPermissionTo('tickets.create')
            && $user->hasPermissionTo('client.portal.access')
            && $this->hasPortalClient($user);
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
        if ($user->tenant_id !== $ticket->tenant_id) {
            return false;
        }

        if ($this->isSupportStaff($user)) {
            return $user->hasPermissionTo(['tickets.reply', 'tickets.manage']);
        }

        return $user->hasPermissionTo('tickets.reply')
            && $user->hasPermissionTo('client.portal.access')
            && $this->portalOwnsTicket($user, $ticket);
    }

    private function isSupportStaff(User $user): bool
    {
        return $user->hasPermissionTo(['tickets.manage', 'support.access']);
    }

    private function hasPortalClient(User $user): bool
    {
        return Client::query()
            ->where('tenant_id', $user->tenant_id)
            ->where('user_id', $user->id)
            ->exists();
    }

    private function portalOwnsTicket(User $user, Ticket $ticket): bool
    {
        if ($ticket->relationLoaded('client')) {
            return $ticket->client?->user_id === $user->id;
        }

        return $ticket->client()->where('user_id', $user->id)->exists();
    }
}
