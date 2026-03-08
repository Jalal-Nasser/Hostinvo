<?php

namespace App\Services\Support;

use App\Contracts\Repositories\Auth\UserRepositoryInterface;
use App\Contracts\Repositories\Clients\ClientRepositoryInterface;
use App\Contracts\Repositories\Support\SupportRepositoryInterface;
use App\Models\Client;
use App\Models\ClientContact;
use App\Models\Ticket;
use App\Models\TicketDepartment;
use App\Models\TicketReply;
use App\Models\TicketStatus;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SupportService
{
    /**
     * @var array<string, bool>
     */
    private array $bootstrappedTenants = [];

    public function __construct(
        private readonly SupportRepositoryInterface $support,
        private readonly ClientRepositoryInterface $clients,
        private readonly UserRepositoryInterface $users,
    ) {
    }

    public function paginateTickets(array $filters, User $actor): LengthAwarePaginator
    {
        $this->ensureSupportCatalog($actor);

        return $this->support->paginateTickets($filters);
    }

    public function getTicketForDisplay(Ticket $ticket, User $actor): Ticket
    {
        $this->ensureSupportCatalog($actor);

        return $this->support->findTicketByIdForDisplay($ticket->getKey()) ?? $ticket;
    }

    public function createTicket(array $payload, User $actor): Ticket
    {
        return DB::transaction(function () use ($payload, $actor): Ticket {
            $this->ensureSupportCatalog($actor);

            $client = $this->resolveClient($payload['client_id'], $actor->tenant_id);
            $department = $this->resolveDepartment($payload['department_id'] ?? null);
            $status = $this->resolveStatus($payload['status_id'] ?? null, TicketStatus::CODE_OPEN);
            $clientContact = $this->resolveClientContact(
                $client,
                $payload['client_contact_id'] ?? null,
                required: false,
            );
            $assignee = $this->resolveAssignee($payload['assigned_to_user_id'] ?? null, $actor->tenant_id);
            $source = $this->resolveSource($actor, $payload['source'] ?? null);

            $ticket = $this->support->createTicket([
                'tenant_id' => $actor->tenant_id,
                'department_id' => $department->id,
                'status_id' => $status->id,
                'status' => $status->code,
                'client_id' => $client->id,
                'client_contact_id' => $clientContact?->id,
                'opened_by_user_id' => $actor->id,
                'assigned_to_user_id' => $assignee?->id,
                'ticket_number' => $this->generateTicketNumber(),
                'subject' => trim((string) $payload['subject']),
                'priority' => $payload['priority'],
                'source' => $source,
                'metadata' => $payload['metadata'] ?? null,
            ]);

            $reply = $this->support->createReply($ticket, [
                'tenant_id' => $ticket->tenant_id,
                'user_id' => $actor->id,
                'client_contact_id' => $clientContact?->id,
                'reply_type' => $this->resolveReplyType($actor, false),
                'is_internal' => false,
                'message' => trim((string) $payload['message']),
                'metadata' => [
                    'is_initial_message' => true,
                ],
            ]);

            $this->applyReplyState($ticket, $reply, $status, filled($payload['status_id'] ?? null));

            return $this->getTicketForDisplay($ticket, $actor);
        });
    }

    public function updateTicket(Ticket $ticket, array $payload, User $actor): Ticket
    {
        return DB::transaction(function () use ($ticket, $payload, $actor): Ticket {
            $this->ensureSupportCatalog($actor);

            $client = $this->resolveClient($payload['client_id'] ?? $ticket->client_id, $ticket->tenant_id);
            $department = $this->resolveDepartment($payload['department_id'] ?? $ticket->department_id);
            $status = $this->resolveStatus($payload['status_id'] ?? $ticket->status_id);
            $clientContact = $this->resolveClientContact(
                $client,
                $payload['client_contact_id'] ?? $ticket->client_contact_id,
                required: false,
            );
            $assignee = $this->resolveAssignee($payload['assigned_to_user_id'] ?? $ticket->assigned_to_user_id, $ticket->tenant_id);

            $this->support->updateTicket($ticket, array_merge(
                Arr::only($payload, ['subject', 'priority', 'metadata']),
                [
                    'client_id' => $client->id,
                    'department_id' => $department->id,
                    'status_id' => $status->id,
                    'status' => $status->code,
                    'client_contact_id' => $clientContact?->id,
                    'assigned_to_user_id' => $assignee?->id,
                    'closed_at' => $status->is_closed ? ($ticket->closed_at ?? now()) : null,
                ]
            ));

            return $this->getTicketForDisplay($ticket, $actor);
        });
    }

    public function deleteTicket(Ticket $ticket): void
    {
        $this->support->deleteTicket($ticket);
    }

    public function addReply(Ticket $ticket, array $payload, User $actor): Ticket
    {
        return DB::transaction(function () use ($ticket, $payload, $actor): Ticket {
            $this->ensureSupportCatalog($actor);

            $client = $this->resolveClient($ticket->client_id, $ticket->tenant_id);
            $isInternal = (bool) ($payload['is_internal'] ?? false);

            if ($isInternal && ! $actor->hasPermissionTo(['tickets.manage', 'support.access'])) {
                throw ValidationException::withMessages([
                    'is_internal' => ['Internal notes are only available to support staff.'],
                ]);
            }

            $clientContact = $this->resolveClientContact(
                $client,
                $payload['client_contact_id'] ?? $ticket->client_contact_id,
                required: false,
            );
            $status = $this->resolveReplyStatus($ticket, $payload, $actor, $isInternal);
            $assignee = $this->resolveAssignee($payload['assigned_to_user_id'] ?? $ticket->assigned_to_user_id, $ticket->tenant_id);
            $replyType = $this->resolveReplyType($actor, $isInternal);

            $reply = $this->support->createReply($ticket, [
                'tenant_id' => $ticket->tenant_id,
                'user_id' => $actor->id,
                'client_contact_id' => $clientContact?->id,
                'reply_type' => $replyType,
                'is_internal' => $isInternal,
                'message' => trim((string) $payload['message']),
                'metadata' => $payload['metadata'] ?? null,
            ]);

            $this->support->updateTicket($ticket, [
                'assigned_to_user_id' => $assignee?->id,
            ]);

            $this->applyReplyState($ticket, $reply, $status, filled($payload['status_id'] ?? null));

            return $this->getTicketForDisplay($ticket, $actor);
        });
    }

    public function paginateDepartments(array $filters, User $actor): LengthAwarePaginator
    {
        $this->ensureSupportCatalog($actor);

        return $this->support->paginateDepartments($filters);
    }

    public function listDepartments(User $actor, bool $onlyActive = false): Collection
    {
        $this->ensureSupportCatalog($actor);

        return $this->support->listDepartments($onlyActive);
    }

    public function createDepartment(array $payload, User $actor): TicketDepartment
    {
        $this->ensureSupportCatalog($actor);

        return $this->support->createDepartment([
            'tenant_id' => $actor->tenant_id,
            'name' => trim((string) $payload['name']),
            'slug' => Str::slug((string) ($payload['slug'] ?? $payload['name'])),
            'description' => $payload['description'] ?? null,
            'is_active' => (bool) ($payload['is_active'] ?? true),
            'display_order' => (int) ($payload['display_order'] ?? 0),
        ]);
    }

    public function updateDepartment(TicketDepartment $department, array $payload, User $actor): TicketDepartment
    {
        $this->ensureSupportCatalog($actor);

        return $this->support->updateDepartment($department, [
            'name' => trim((string) ($payload['name'] ?? $department->name)),
            'slug' => Str::slug((string) ($payload['slug'] ?? $payload['name'] ?? $department->slug)),
            'description' => $payload['description'] ?? $department->description,
            'is_active' => (bool) ($payload['is_active'] ?? $department->is_active),
            'display_order' => (int) ($payload['display_order'] ?? $department->display_order),
        ]);
    }

    public function deleteDepartment(TicketDepartment $department): void
    {
        if ($department->tickets()->exists()) {
            throw ValidationException::withMessages([
                'department' => ['Departments with linked tickets cannot be archived.'],
            ]);
        }

        $this->support->deleteDepartment($department);
    }

    public function listStatuses(User $actor): Collection
    {
        $this->ensureSupportCatalog($actor);

        return $this->support->listStatuses();
    }

    public function getOverview(User $actor): array
    {
        $this->ensureSupportCatalog($actor);

        return [
            'stats' => $this->support->ticketStats(),
            'departments' => $this->support->listDepartments(),
            'statuses' => $this->support->listStatuses(),
            'recent_tickets' => $this->support->recentTickets(),
        ];
    }

    private function ensureSupportCatalog(User $actor): void
    {
        $tenantId = $actor->tenant_id;

        if (blank($tenantId)) {
            throw ValidationException::withMessages([
                'tenant' => ['Tenant context is required for support management.'],
            ]);
        }

        if ($this->bootstrappedTenants[$tenantId] ?? false) {
            return;
        }

        foreach (TicketDepartment::defaultCatalog() as $department) {
            $slug = Str::slug($department['name']);

            $this->support->upsertDepartmentBySlug($slug, [
                'tenant_id' => $tenantId,
                'name' => $department['name'],
                'description' => $department['description'],
                'is_active' => $department['is_active'],
                'display_order' => $department['display_order'],
            ]);
        }

        foreach (TicketStatus::defaultCatalog() as $status) {
            $this->support->upsertStatusByCode($status['code'], [
                'tenant_id' => $tenantId,
                'name' => $status['name'],
                'color' => $status['color'],
                'is_default' => $status['is_default'],
                'is_closed' => $status['is_closed'],
                'display_order' => $status['display_order'],
            ]);
        }

        $this->bootstrappedTenants[$tenantId] = true;
    }

    private function resolveClient(string $clientId, string $tenantId): Client
    {
        $client = $this->clients->findByIdForDisplay($clientId);

        if (! $client || $client->tenant_id !== $tenantId) {
            throw ValidationException::withMessages([
                'client_id' => ['The selected client is invalid for the current tenant.'],
            ]);
        }

        return $client;
    }

    private function resolveDepartment(?string $departmentId): TicketDepartment
    {
        if (filled($departmentId)) {
            $department = $this->support->findDepartmentById((string) $departmentId);

            if (! $department || ! $department->is_active) {
                throw ValidationException::withMessages([
                    'department_id' => ['The selected support department is invalid.'],
                ]);
            }

            return $department;
        }

        $department = $this->support->listDepartments(true)->first();

        if (! $department instanceof TicketDepartment) {
            throw ValidationException::withMessages([
                'department_id' => ['No active support departments are configured for this tenant.'],
            ]);
        }

        return $department;
    }

    private function resolveStatus(?string $statusId, ?string $fallbackCode = null): TicketStatus
    {
        if (filled($statusId)) {
            $status = $this->support->findStatusById((string) $statusId);

            if (! $status) {
                throw ValidationException::withMessages([
                    'status_id' => ['The selected ticket status is invalid.'],
                ]);
            }

            return $status;
        }

        if ($fallbackCode) {
            $status = $this->support->findStatusByCode($fallbackCode);

            if ($status instanceof TicketStatus) {
                return $status;
            }
        }

        $status = $this->support->findDefaultStatus();

        if (! $status instanceof TicketStatus) {
            throw ValidationException::withMessages([
                'status_id' => ['No default ticket status is configured for this tenant.'],
            ]);
        }

        return $status;
    }

    private function resolveReplyStatus(Ticket $ticket, array $payload, User $actor, bool $isInternal): TicketStatus
    {
        if (filled($payload['status_id'] ?? null)) {
            return $this->resolveStatus((string) $payload['status_id']);
        }

        if ($isInternal) {
            $currentStatus = $ticket->relationLoaded('status')
                ? $ticket->getRelation('status')
                : $this->support->findStatusById((string) $ticket->status_id);

            if ($currentStatus instanceof TicketStatus) {
                return $currentStatus;
            }

            return $this->resolveStatus((string) $ticket->status_id);
        }

        if ($actor->hasPermissionTo(['tickets.manage', 'support.access'])) {
            return $this->resolveStatus(null, TicketStatus::CODE_ANSWERED);
        }

        return $this->resolveStatus(null, TicketStatus::CODE_CUSTOMER_REPLY);
    }

    private function resolveClientContact(Client $client, mixed $clientContactId, bool $required): ?ClientContact
    {
        if (! filled($clientContactId)) {
            if ($required) {
                throw ValidationException::withMessages([
                    'client_contact_id' => ['A client contact is required for this ticket.'],
                ]);
            }

            return null;
        }

        $clientContact = $client->contacts?->firstWhere('id', $clientContactId);

        if (! $clientContact) {
            throw ValidationException::withMessages([
                'client_contact_id' => ['The selected client contact is invalid for the selected client.'],
            ]);
        }

        return $clientContact;
    }

    private function resolveAssignee(?string $userId, string $tenantId): ?User
    {
        if (! filled($userId)) {
            return null;
        }

        $user = $this->users->findById((string) $userId);

        if (! $user || $user->tenant_id !== $tenantId) {
            throw ValidationException::withMessages([
                'assigned_to_user_id' => ['The selected assignee is invalid for the current tenant.'],
            ]);
        }

        return $user;
    }

    private function resolveSource(User $actor, ?string $requestedSource): string
    {
        if (filled($requestedSource) && in_array($requestedSource, Ticket::sources(), true)) {
            return (string) $requestedSource;
        }

        return $actor->hasPermissionTo(['tickets.manage', 'support.access'])
            ? Ticket::SOURCE_ADMIN
            : Ticket::SOURCE_PORTAL;
    }

    private function resolveReplyType(User $actor, bool $isInternal): string
    {
        if ($isInternal) {
            return TicketReply::TYPE_INTERNAL_NOTE;
        }

        return $actor->hasPermissionTo(['tickets.manage', 'support.access'])
            ? TicketReply::TYPE_ADMIN
            : TicketReply::TYPE_CLIENT;
    }

    private function applyReplyState(Ticket $ticket, TicketReply $reply, TicketStatus $status, bool $statusWasExplicit): void
    {
        $appliedStatus = $status;
        $attributes = [
            'status_id' => $status->id,
            'status' => $status->code,
            'closed_at' => $status->is_closed ? ($ticket->closed_at ?? now()) : null,
        ];

        if (! $reply->is_internal) {
            $attributes['last_reply_at'] = $reply->created_at;

            if ($reply->reply_type === TicketReply::TYPE_ADMIN) {
                $attributes['last_reply_by'] = Ticket::REPLY_BY_ADMIN;
                $attributes['last_admin_reply_at'] = $reply->created_at;

                if (! $statusWasExplicit && ! $status->is_closed) {
                    $appliedStatus = $this->resolveStatus(null, TicketStatus::CODE_ANSWERED);
                    $attributes['status_id'] = $appliedStatus->id;
                    $attributes['status'] = $appliedStatus->code;
                    $attributes['closed_at'] = null;
                }
            } elseif ($reply->reply_type === TicketReply::TYPE_CLIENT) {
                $attributes['last_reply_by'] = Ticket::REPLY_BY_CLIENT;
                $attributes['last_client_reply_at'] = $reply->created_at;

                if (! $statusWasExplicit && ! $status->is_closed) {
                    $appliedStatus = $this->resolveStatus(null, TicketStatus::CODE_CUSTOMER_REPLY);
                    $attributes['status_id'] = $appliedStatus->id;
                    $attributes['status'] = $appliedStatus->code;
                    $attributes['closed_at'] = null;
                }
            }
        } else {
            $attributes['last_reply_by'] = Ticket::REPLY_BY_INTERNAL;

            if (! $statusWasExplicit) {
                unset($attributes['status_id'], $attributes['status'], $attributes['closed_at']);
            }
        }

        $this->support->updateTicket($ticket, $attributes);
    }

    private function generateTicketNumber(): string
    {
        return sprintf('TKT-%s-%s', now()->format('YmdHis'), Str::upper(Str::random(4)));
    }
}
