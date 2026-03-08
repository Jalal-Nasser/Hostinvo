<?php

namespace App\Contracts\Repositories\Support;

use App\Models\Ticket;
use App\Models\TicketDepartment;
use App\Models\TicketReply;
use App\Models\TicketStatus;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface SupportRepositoryInterface
{
    public function paginateTickets(array $filters): LengthAwarePaginator;

    public function findTicketById(string $id): ?Ticket;

    public function findTicketByIdForDisplay(string $id): ?Ticket;

    public function createTicket(array $attributes): Ticket;

    public function updateTicket(Ticket $ticket, array $attributes): Ticket;

    public function deleteTicket(Ticket $ticket): void;

    public function createReply(Ticket $ticket, array $attributes): TicketReply;

    public function paginateDepartments(array $filters): LengthAwarePaginator;

    public function listDepartments(bool $onlyActive = false): Collection;

    public function findDepartmentById(string $id): ?TicketDepartment;

    public function createDepartment(array $attributes): TicketDepartment;

    public function updateDepartment(TicketDepartment $department, array $attributes): TicketDepartment;

    public function deleteDepartment(TicketDepartment $department): void;

    public function upsertDepartmentBySlug(string $slug, array $attributes): TicketDepartment;

    public function listStatuses(): Collection;

    public function findStatusById(string $id): ?TicketStatus;

    public function findStatusByCode(string $code): ?TicketStatus;

    public function findDefaultStatus(): ?TicketStatus;

    public function upsertStatusByCode(string $code, array $attributes): TicketStatus;

    public function ticketStats(): array;

    public function recentTickets(int $limit = 10): Collection;
}
