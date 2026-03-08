<?php

namespace App\Repositories\Domains;

use App\Contracts\Repositories\Domains\DomainRepositoryInterface;
use App\Models\Domain;
use App\Models\DomainRenewal;
use App\Models\RegistrarLog;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;

class EloquentDomainRepository implements DomainRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);

        return Domain::query()
            ->with(['client', 'service'])
            ->withCount(['contacts', 'renewals'])
            ->when(
                filled($filters['search'] ?? null),
                fn (Builder $query) => $query->where(function (Builder $builder) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $builder
                        ->where('domain', 'like', "%{$search}%")
                        ->orWhere('registrar', 'like', "%{$search}%");
                })
            )
            ->when(
                filled($filters['status'] ?? null),
                fn (Builder $query) => $query->where('status', $filters['status'])
            )
            ->when(
                filled($filters['client_id'] ?? null),
                fn (Builder $query) => $query->where('client_id', $filters['client_id'])
            )
            ->when(
                filled($filters['registrar'] ?? null),
                fn (Builder $query) => $query->where('registrar', $filters['registrar'])
            )
            ->orderBy('expiry_date')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function paginateForPortal(User $user, array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);

        return $this->portalAccessibleQuery($user)
            ->with(['client', 'service'])
            ->withCount(['contacts', 'renewals'])
            ->when(
                filled($filters['search'] ?? null),
                fn (Builder $query) => $query->where('domain', 'like', '%'.trim((string) $filters['search']).'%')
            )
            ->when(
                filled($filters['status'] ?? null),
                fn (Builder $query) => $query->where('status', $filters['status'])
            )
            ->orderBy('expiry_date')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function findById(string $id): ?Domain
    {
        return Domain::query()->find($id);
    }

    public function findByIdForDisplay(string $id): ?Domain
    {
        return Domain::query()
            ->with([
                'client',
                'service',
                'contacts' => fn ($query) => $query->orderBy('type'),
                'renewals' => fn ($query) => $query->latest('created_at'),
                'registrarLogs' => fn ($query) => $query->latest('created_at')->limit(25),
            ])
            ->withCount(['contacts', 'renewals'])
            ->find($id);
    }

    public function findByIdForPortalDisplay(User $user, string $id): ?Domain
    {
        return $this->portalAccessibleQuery($user)
            ->with([
                'client',
                'service',
                'contacts' => fn ($query) => $query->orderBy('type'),
                'renewals' => fn ($query) => $query->latest('created_at'),
            ])
            ->withCount(['contacts', 'renewals'])
            ->find($id);
    }

    public function create(array $attributes): Domain
    {
        return Domain::query()->create($attributes);
    }

    public function update(Domain $domain, array $attributes): Domain
    {
        $domain->fill($attributes);
        $domain->save();

        return $domain;
    }

    public function syncContacts(Domain $domain, array $contacts): void
    {
        $existing = $domain->contacts()->get()->keyBy('id');
        $retainedIds = [];

        foreach ($contacts as $contact) {
            $id = $contact['id'] ?? null;
            $attributes = Arr::except($contact, ['id']);
            $attributes['tenant_id'] = $domain->tenant_id;

            if ($id && $existing->has($id)) {
                $existing->get($id)?->fill($attributes)->save();
                $retainedIds[] = $id;
                continue;
            }

            $created = $domain->contacts()->create($attributes);
            $retainedIds[] = $created->getKey();
        }

        $deleteQuery = $domain->contacts();

        if ($retainedIds !== []) {
            $deleteQuery->whereNotIn('id', $retainedIds)->delete();

            return;
        }

        $deleteQuery->delete();
    }

    public function createRenewal(Domain $domain, array $attributes): DomainRenewal
    {
        return $domain->renewals()->create([
            'tenant_id' => $domain->tenant_id,
            'years' => $attributes['years'],
            'price' => $attributes['price'],
            'status' => $attributes['status'],
            'renewed_at' => $attributes['renewed_at'] ?? null,
        ]);
    }

    public function logRegistrarActivity(Domain $domain, array $attributes): RegistrarLog
    {
        return $domain->registrarLogs()->create([
            'tenant_id' => $domain->tenant_id,
            'operation' => $attributes['operation'],
            'status' => $attributes['status'],
            'request_payload' => $attributes['request_payload'] ?? null,
            'response_payload' => $attributes['response_payload'] ?? null,
            'error_message' => $attributes['error_message'] ?? null,
        ]);
    }

    public function delete(Domain $domain): void
    {
        $domain->delete();
    }

    private function portalAccessibleQuery(User $user): Builder
    {
        return Domain::query()->whereHas('client', function (Builder $query) use ($user): void {
            $query->where('user_id', $user->id);
        });
    }
}
