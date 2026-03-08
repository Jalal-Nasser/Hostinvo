<?php

namespace App\Services\Domains;

use App\Contracts\Repositories\Domains\DomainRepositoryInterface;
use App\Models\Domain;
use App\Models\DomainRenewal;
use App\Models\RegistrarLog;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DomainService
{
    public function __construct(
        private readonly DomainRepositoryInterface $domains,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->domains->paginate($filters);
    }

    public function paginateForPortal(User $user, array $filters): LengthAwarePaginator
    {
        return $this->domains->paginateForPortal($user, $filters);
    }

    public function getForDisplay(Domain $domain): Domain
    {
        return $this->domains->findByIdForDisplay($domain->getKey()) ?? $domain;
    }

    public function getForPortalDisplay(User $user, Domain $domain): ?Domain
    {
        return $this->domains->findByIdForPortalDisplay($user, $domain->getKey());
    }

    public function create(array $payload, User $actor): Domain
    {
        return DB::transaction(function () use ($payload, $actor): Domain {
            $domain = $this->domains->create($this->extractDomainAttributes($payload, $actor));

            if (array_key_exists('contacts', $payload)) {
                $this->domains->syncContacts($domain, $this->normalizeContacts($payload['contacts'] ?? []));
            }

            return $this->getForDisplay($domain);
        });
    }

    public function update(Domain $domain, array $payload, User $actor): Domain
    {
        return DB::transaction(function () use ($domain, $payload, $actor): Domain {
            $this->domains->update($domain, $this->extractDomainAttributes($payload, $actor, $domain));

            if (array_key_exists('contacts', $payload)) {
                $this->domains->syncContacts($domain, $this->normalizeContacts($payload['contacts'] ?? []));

                $this->domains->logRegistrarActivity($domain, [
                    'operation' => 'update_contacts',
                    'status' => RegistrarLog::STATUS_SUCCESS,
                    'request_payload' => [
                        'source' => 'admin',
                        'contacts_count' => count($payload['contacts'] ?? []),
                    ],
                    'response_payload' => [
                        'placeholder' => true,
                        'message' => 'Contact update recorded without a live registrar integration.',
                    ],
                ]);
            }

            return $this->getForDisplay($domain);
        });
    }

    public function syncContacts(Domain $domain, array $payload, User $actor, string $source = 'admin'): Domain
    {
        return DB::transaction(function () use ($domain, $payload, $actor, $source): Domain {
            $contacts = $this->normalizeContacts($payload['contacts'] ?? []);

            $this->domains->syncContacts($domain, $contacts);

            $this->domains->logRegistrarActivity($domain, [
                'operation' => 'update_contacts',
                'status' => RegistrarLog::STATUS_SUCCESS,
                'request_payload' => [
                    'source' => $source,
                    'actor_id' => $actor->id,
                    'contacts_count' => count($contacts),
                ],
                'response_payload' => [
                    'placeholder' => true,
                    'message' => 'Contact update stored locally until registrar drivers are implemented.',
                ],
            ]);

            return $this->getForDisplay($domain);
        });
    }

    public function addRenewal(Domain $domain, array $payload, User $actor): DomainRenewal
    {
        return DB::transaction(function () use ($domain, $payload, $actor): DomainRenewal {
            $renewal = $this->domains->createRenewal($domain, [
                'years' => (int) $payload['years'],
                'price' => (int) $payload['price'],
                'status' => $payload['status'],
                'renewed_at' => $payload['renewed_at'] ?? null,
            ]);

            $this->domains->logRegistrarActivity($domain, [
                'operation' => 'renew',
                'status' => $renewal->status === DomainRenewal::STATUS_FAILED
                    ? RegistrarLog::STATUS_FAILED
                    : RegistrarLog::STATUS_SUCCESS,
                'request_payload' => [
                    'source' => 'admin',
                    'actor_id' => $actor->id,
                    'years' => $renewal->years,
                    'price' => $renewal->price,
                    'status' => $renewal->status,
                ],
                'response_payload' => [
                    'placeholder' => true,
                    'message' => 'Renewal history recorded without a live registrar integration.',
                ],
                'error_message' => $renewal->status === DomainRenewal::STATUS_FAILED
                    ? 'Renewal marked as failed by a manual placeholder flow.'
                    : null,
            ]);

            return $renewal->refresh();
        });
    }

    public function delete(Domain $domain): void
    {
        $this->domains->delete($domain);
    }

    private function extractDomainAttributes(array $payload, User $actor, ?Domain $domain = null): array
    {
        $tenantId = $domain?->tenant_id ?? $actor->tenant_id;

        if (blank($tenantId)) {
            throw ValidationException::withMessages([
                'tenant' => ['Tenant context is required for domain management.'],
            ]);
        }

        return array_merge(
            Arr::only($payload, [
                'client_id',
                'service_id',
                'status',
                'registrar',
                'registration_date',
                'expiry_date',
                'auto_renew',
                'dns_management',
                'id_protection',
                'renewal_price',
                'notes',
                'metadata',
            ]),
            [
                'tenant_id' => $tenantId,
                'domain' => Str::lower($payload['domain']),
                'tld' => Str::lower(ltrim((string) $payload['tld'], '.')),
                'currency' => Str::upper($payload['currency']),
            ]
        );
    }

    private function normalizeContacts(array $contacts): array
    {
        return collect($contacts)
            ->values()
            ->map(fn (array $contact): array => [
                'id' => $contact['id'] ?? null,
                'type' => $contact['type'],
                'first_name' => $contact['first_name'],
                'last_name' => $contact['last_name'],
                'email' => Str::lower($contact['email']),
                'phone' => $contact['phone'] ?? null,
                'address' => [
                    'line1' => $contact['address']['line1'],
                    'city' => $contact['address']['city'],
                    'state' => $contact['address']['state'] ?? null,
                    'postal_code' => $contact['address']['postal_code'] ?? null,
                    'country' => Str::upper($contact['address']['country']),
                ],
            ])
            ->all();
    }
}
