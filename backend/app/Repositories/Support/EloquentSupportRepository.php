<?php

namespace App\Repositories\Support;

use App\Contracts\Repositories\Support\SupportRepositoryInterface;
use App\Models\Ticket;
use App\Models\TicketDepartment;
use App\Models\TicketReply;
use App\Models\TicketStatus;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class EloquentSupportRepository implements SupportRepositoryInterface
{
    public function paginateTickets(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);

        return Ticket::query()
            ->with(['department', 'status', 'client', 'assignedTo'])
            ->withCount('replies')
            ->when(
                filled($filters['search'] ?? null),
                fn (Builder $query) => $query->where(function (Builder $builder) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $builder
                        ->where('ticket_number', 'like', "%{$search}%")
                        ->orWhere('subject', 'like', "%{$search}%")
                        ->orWhereHas('client', function (Builder $clientQuery) use ($search): void {
                            $clientQuery
                                ->where('company_name', 'like', "%{$search}%")
                                ->orWhere('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                })
            )
            ->when(
                filled($filters['status_id'] ?? null),
                fn (Builder $query) => $query->where('status_id', $filters['status_id'])
            )
            ->when(
                filled($filters['priority'] ?? null),
                fn (Builder $query) => $query->where('priority', $filters['priority'])
            )
            ->when(
                filled($filters['department_id'] ?? null),
                fn (Builder $query) => $query->where('department_id', $filters['department_id'])
            )
            ->latest('last_reply_at')
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function findTicketById(string $id): ?Ticket
    {
        return Ticket::query()->find($id);
    }

    public function findTicketByIdForDisplay(string $id): ?Ticket
    {
        return Ticket::query()
            ->with([
                'department',
                'status',
                'client.contacts',
                'clientContact',
                'openedBy',
                'assignedTo',
                'replies' => fn ($query) => $query
                    ->with(['user', 'clientContact'])
                    ->oldest(),
            ])
            ->withCount('replies')
            ->find($id);
    }

    public function createTicket(array $attributes): Ticket
    {
        return Ticket::query()->create($attributes);
    }

    public function updateTicket(Ticket $ticket, array $attributes): Ticket
    {
        $ticket->fill($attributes);
        $ticket->save();

        return $ticket;
    }

    public function deleteTicket(Ticket $ticket): void
    {
        $ticket->delete();
    }

    public function createReply(Ticket $ticket, array $attributes): TicketReply
    {
        return $ticket->replies()->create($attributes);
    }

    public function paginateDepartments(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);

        return TicketDepartment::query()
            ->withCount('tickets')
            ->when(
                filled($filters['search'] ?? null),
                fn (Builder $query) => $query->where(function (Builder $builder) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $builder
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                })
            )
            ->when(
                array_key_exists('is_active', $filters) && $filters['is_active'] !== null && $filters['is_active'] !== '',
                fn (Builder $query) => $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN))
            )
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function listDepartments(bool $onlyActive = false): Collection
    {
        return TicketDepartment::query()
            ->withCount('tickets')
            ->when($onlyActive, fn (Builder $query) => $query->where('is_active', true))
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();
    }

    public function findDepartmentById(string $id): ?TicketDepartment
    {
        return TicketDepartment::query()->find($id);
    }

    public function createDepartment(array $attributes): TicketDepartment
    {
        return TicketDepartment::query()->create($attributes);
    }

    public function updateDepartment(TicketDepartment $department, array $attributes): TicketDepartment
    {
        $department->fill($attributes);
        $department->save();

        return $department;
    }

    public function deleteDepartment(TicketDepartment $department): void
    {
        $department->delete();
    }

    public function upsertDepartmentBySlug(string $slug, array $attributes): TicketDepartment
    {
        /** @var TicketDepartment $department */
        $department = TicketDepartment::query()->withTrashed()->firstOrNew(['slug' => $slug]);
        $wasDeleted = $department->trashed();

        $department->fill($attributes);
        $department->slug = $slug;
        $department->save();

        if ($wasDeleted) {
            $department->restore();
        }

        return $department;
    }

    public function listStatuses(): Collection
    {
        return TicketStatus::query()
            ->withCount('tickets')
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();
    }

    public function findStatusById(string $id): ?TicketStatus
    {
        return TicketStatus::query()->find($id);
    }

    public function findStatusByCode(string $code): ?TicketStatus
    {
        return TicketStatus::query()->where('code', $code)->first();
    }

    public function findDefaultStatus(): ?TicketStatus
    {
        return TicketStatus::query()
            ->orderByDesc('is_default')
            ->orderBy('display_order')
            ->first();
    }

    public function upsertStatusByCode(string $code, array $attributes): TicketStatus
    {
        /** @var TicketStatus $status */
        $status = TicketStatus::query()->withTrashed()->firstOrNew(['code' => $code]);
        $wasDeleted = $status->trashed();

        $status->fill($attributes);
        $status->code = $code;
        $status->save();

        if ($wasDeleted) {
            $status->restore();
        }

        return $status;
    }

    public function ticketStats(): array
    {
        return [
            'total' => Ticket::query()->count(),
            'open' => Ticket::query()
                ->whereHas('status', fn (Builder $query) => $query->where('is_closed', false))
                ->count(),
            'closed' => Ticket::query()
                ->whereHas('status', fn (Builder $query) => $query->where('is_closed', true))
                ->count(),
            'urgent' => Ticket::query()->where('priority', Ticket::PRIORITY_URGENT)->count(),
            'unassigned' => Ticket::query()->whereNull('assigned_to_user_id')->count(),
        ];
    }

    public function recentTickets(int $limit = 10): Collection
    {
        return Ticket::query()
            ->with(['department', 'status', 'client', 'assignedTo'])
            ->withCount('replies')
            ->latest('last_reply_at')
            ->latest()
            ->limit($limit)
            ->get();
    }
}
