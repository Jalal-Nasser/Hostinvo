<?php

namespace App\Contracts\Repositories\Clients;

use App\Models\Client;
use App\Models\ClientActivityLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ClientRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator;

    public function findById(string $id): ?Client;

    public function findByIdForDisplay(string $id): ?Client;

    public function create(array $attributes): Client;

    public function update(Client $client, array $attributes): Client;

    public function syncContacts(Client $client, array $contacts): void;

    public function syncAddresses(Client $client, array $addresses): void;

    public function logActivity(Client $client, array $attributes): ClientActivityLog;

    public function delete(Client $client): void;
}
