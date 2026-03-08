<?php

namespace App\Contracts\Repositories\Domains;

use App\Models\Domain;
use App\Models\DomainRenewal;
use App\Models\RegistrarLog;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface DomainRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;

    public function paginateForPortal(User $user, array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Domain;

    public function findByIdForDisplay(string $id): ?Domain;

    public function findByIdForPortalDisplay(User $user, string $id): ?Domain;

    public function create(array $attributes): Domain;

    public function update(Domain $domain, array $attributes): Domain;

    public function syncContacts(Domain $domain, array $contacts): void;

    public function createRenewal(Domain $domain, array $attributes): DomainRenewal;

    public function logRegistrarActivity(Domain $domain, array $attributes): RegistrarLog;

    public function delete(Domain $domain): void;
}
