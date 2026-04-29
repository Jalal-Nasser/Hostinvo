<?php

namespace App\Repositories\Clients;

use App\Contracts\Repositories\Clients\ClientRepositoryInterface;
use App\Models\Client;
use App\Models\ClientActivityLog;
use App\Repositories\Concerns\ResolvesPagination;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;

class EloquentClientRepository implements ClientRepositoryInterface
{
    use ResolvesPagination;

    public function paginate(array $filters): LengthAwarePaginator
    {
        $perPage = $this->resolvePerPage($filters);

        return Client::query()
            ->with('owner')
            ->withCount(['contacts', 'addresses', 'services'])
            ->when(
                filled($filters['search'] ?? null),
                fn (Builder $query) => $query->where(function (Builder $builder) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $builder
                        ->where('company_name', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                })
            )
            ->when(
                filled($filters['status'] ?? null),
                fn (Builder $query) => $query->where('status', $filters['status'])
            )
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function findById(string $id): ?Client
    {
        return Client::query()->find($id);
    }

    public function findByIdForDisplay(string $id): ?Client
    {
        return Client::query()
            ->with([
                'owner',
                'contacts' => fn ($query) => $query
                    ->orderByDesc('is_primary')
                    ->orderBy('first_name')
                    ->orderBy('last_name'),
                'addresses' => fn ($query) => $query
                    ->orderByDesc('is_primary')
                    ->orderBy('type'),
                'activityLogs' => fn ($query) => $query
                    ->with('user')
                    ->latest()
                    ->limit(25),
                'services' => fn ($query) => $query
                    ->with(['product'])
                    ->latest()
                    ->limit(10),
                'invoices' => fn ($query) => $query
                    ->latest('issue_date')
                    ->limit(10),
            ])
            ->withCount(['contacts', 'addresses', 'services', 'invoices'])
            ->find($id);
    }

    public function create(array $attributes): Client
    {
        $client = new Client();
        $client->forceFill($attributes);
        $client->save();

        return $client;
    }

    public function update(Client $client, array $attributes): Client
    {
        $client->fill($attributes);
        $client->save();

        return $client;
    }

    public function syncContacts(Client $client, array $contacts): void
    {
        $existing = $client->contacts()->get()->keyBy('id');
        $retainedIds = [];

        foreach ($contacts as $contact) {
            $id = $contact['id'] ?? null;
            $attributes = Arr::except($contact, ['id']);
            $attributes['tenant_id'] = $client->tenant_id;

            if ($id && $existing->has($id)) {
                $existing->get($id)?->fill($attributes)->save();
                $retainedIds[] = $id;
                continue;
            }

            $created = $client->contacts()->create($attributes);
            $retainedIds[] = $created->getKey();
        }

        $deleteQuery = $client->contacts();

        if ($retainedIds !== []) {
            $deleteQuery->whereNotIn('id', $retainedIds)->delete();
            return;
        }

        $deleteQuery->delete();
    }

    public function syncAddresses(Client $client, array $addresses): void
    {
        $existing = $client->addresses()->get()->keyBy('id');
        $retainedIds = [];

        foreach ($addresses as $address) {
            $id = $address['id'] ?? null;
            $attributes = Arr::except($address, ['id']);
            $attributes['tenant_id'] = $client->tenant_id;

            if ($id && $existing->has($id)) {
                $existing->get($id)?->fill($attributes)->save();
                $retainedIds[] = $id;
                continue;
            }

            $created = $client->addresses()->create($attributes);
            $retainedIds[] = $created->getKey();
        }

        $deleteQuery = $client->addresses();

        if ($retainedIds !== []) {
            $deleteQuery->whereNotIn('id', $retainedIds)->delete();
            return;
        }

        $deleteQuery->delete();
    }

    public function logActivity(Client $client, array $attributes): ClientActivityLog
    {
        return $client->activityLogs()->create([
            'tenant_id' => $client->tenant_id,
            'user_id' => $attributes['user_id'] ?? null,
            'action' => $attributes['action'],
            'description' => $attributes['description'],
            'metadata' => $attributes['metadata'] ?? null,
        ]);
    }

    public function delete(Client $client): void
    {
        $client->delete();
    }
}
