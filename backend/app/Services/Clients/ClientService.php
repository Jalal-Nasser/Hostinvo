<?php

namespace App\Services\Clients;

use App\Contracts\Repositories\Clients\ClientRepositoryInterface;
use App\Models\Client;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Auth\EmailVerificationService;
use App\Services\Notifications\NotificationDispatchService;
use App\Services\Notifications\NotificationEventCatalog;
use App\Services\Licensing\LicenseService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ClientService
{
    public function __construct(
        private readonly ClientRepositoryInterface $clients,
        private readonly LicenseService $licenseService,
        private readonly EmailVerificationService $emailVerification,
        private readonly NotificationDispatchService $notifications,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->clients->paginate($filters);
    }

    public function getForDisplay(Client $client): Client
    {
        return $this->clients->findByIdForDisplay($client->getKey()) ?? $client;
    }

    public function create(array $payload, User $actor): Client
    {
        return DB::transaction(function () use ($payload, $actor): Client {
            $this->licenseService->enforceClientLimitForTenant(
                $actor->tenant_id,
                (string) ($payload['status'] ?? Client::STATUS_ACTIVE),
            );

            $client = $this->clients->create($this->extractClientAttributes($payload, $actor));

            if (array_key_exists('contacts', $payload)) {
                $this->clients->syncContacts($client, $this->normalizeContacts($payload['contacts'] ?? []));
            }

            if (array_key_exists('addresses', $payload)) {
                $this->clients->syncAddresses($client, $this->normalizeAddresses($payload['addresses'] ?? []));
            }

            $this->syncPortalAccess($client, $payload, $actor);

            $this->clients->logActivity($client, [
                'user_id' => $actor->id,
                'action' => 'client.created',
                'description' => 'Client record created.',
                'metadata' => $this->activitySnapshot($payload),
            ]);

            return $this->getForDisplay($client);
        });
    }

    public function update(Client $client, array $payload, User $actor): Client
    {
        return DB::transaction(function () use ($client, $payload, $actor): Client {
            $incomingStatus = (string) ($payload['status'] ?? $client->status);

            if ($client->status !== Client::STATUS_ACTIVE && $incomingStatus === Client::STATUS_ACTIVE) {
                $this->licenseService->enforceClientLimitForTenant($actor->tenant_id, $incomingStatus);
            }

            $this->clients->update($client, $this->extractClientAttributes($payload, $actor, $client));

            if (array_key_exists('contacts', $payload)) {
                $this->clients->syncContacts($client, $this->normalizeContacts($payload['contacts'] ?? []));
            }

            if (array_key_exists('addresses', $payload)) {
                $this->clients->syncAddresses($client, $this->normalizeAddresses($payload['addresses'] ?? []));
            }

            $this->syncPortalAccess($client, $payload, $actor);

            $this->clients->logActivity($client, [
                'user_id' => $actor->id,
                'action' => 'client.updated',
                'description' => 'Client record updated.',
                'metadata' => $this->activitySnapshot($payload),
            ]);

            return $this->getForDisplay($client);
        });
    }

    public function delete(Client $client, User $actor): void
    {
        DB::transaction(function () use ($client, $actor): void {
            $this->clients->logActivity($client, [
                'user_id' => $actor->id,
                'action' => 'client.deleted',
                'description' => 'Client record archived.',
                'metadata' => [
                    'status' => $client->status,
                    'email' => $client->email,
                ],
            ]);

            $this->clients->delete($client);
        });
    }

    private function extractClientAttributes(array $payload, User $actor, ?Client $client = null): array
    {
        $tenantId = $client?->tenant_id ?? $actor->tenant_id;

        if (blank($tenantId)) {
            throw ValidationException::withMessages([
                'tenant' => ['Tenant context is required for client creation.'],
            ]);
        }

        return array_merge(
            Arr::only($payload, [
                'user_id',
                'client_type',
                'first_name',
                'last_name',
                'company_name',
                'email',
                'phone',
                'country',
                'status',
                'preferred_locale',
                'currency',
                'notes',
            ]),
            [
                'tenant_id' => $tenantId,
                'email' => Str::lower($payload['email']),
                'country' => Str::upper($payload['country']),
                'currency' => Str::upper($payload['currency']),
                'preferred_locale' => $payload['preferred_locale'],
            ]
        );
    }

    private function normalizeContacts(array $contacts): array
    {
        if ($contacts === []) {
            return [];
        }

        $primaryIndex = collect($contacts)->search(fn (array $contact) => (bool) ($contact['is_primary'] ?? false));

        if ($primaryIndex === false) {
            $primaryIndex = 0;
        }

        return collect($contacts)
            ->values()
            ->map(function (array $contact, int $index) use ($primaryIndex): array {
                return [
                    'id' => $contact['id'] ?? null,
                    'first_name' => $contact['first_name'],
                    'last_name' => $contact['last_name'],
                    'email' => Str::lower($contact['email']),
                    'phone' => $contact['phone'] ?? null,
                    'job_title' => $contact['job_title'] ?? null,
                    'is_primary' => $index === $primaryIndex,
                ];
            })
            ->all();
    }

    private function normalizeAddresses(array $addresses): array
    {
        if ($addresses === []) {
            return [];
        }

        $primaryIndex = collect($addresses)->search(fn (array $address) => (bool) ($address['is_primary'] ?? false));

        if ($primaryIndex === false) {
            $primaryIndex = 0;
        }

        return collect($addresses)
            ->values()
            ->map(function (array $address, int $index) use ($primaryIndex): array {
                return [
                    'id' => $address['id'] ?? null,
                    'type' => $address['type'],
                    'line_1' => $address['line_1'],
                    'line_2' => $address['line_2'] ?? null,
                    'city' => $address['city'],
                    'state' => $address['state'] ?? null,
                    'postal_code' => $address['postal_code'] ?? null,
                    'country' => Str::upper($address['country']),
                    'is_primary' => $index === $primaryIndex,
                ];
            })
            ->all();
    }

    private function activitySnapshot(array $payload): array
    {
        return [
            'contacts_count' => count($payload['contacts'] ?? []),
            'addresses_count' => count($payload['addresses'] ?? []),
            'portal_access_enabled' => (bool) ($payload['portal_access']['enabled'] ?? false),
            'status' => $payload['status'] ?? null,
            'preferred_locale' => $payload['preferred_locale'] ?? null,
        ];
    }

    private function syncPortalAccess(Client $client, array $payload, User $actor): void
    {
        if (! array_key_exists('portal_access', $payload)) {
            return;
        }

        $portalAccess = (array) $payload['portal_access'];
        $enabled = (bool) ($portalAccess['enabled'] ?? false);

        if (! $enabled) {
            return;
        }

        $existingUser = $client->owner;
        $password = (string) ($portalAccess['password'] ?? '');
        $locale = (string) ($client->preferred_locale ?: $actor->locale ?: config('app.locale', 'en'));
        $name = $this->portalUserName($client);

        $user = $existingUser ?? new User();
        $isNewUser = ! $user->exists;

        $attributes = [
            'name' => $name,
            'email' => Str::lower($client->email),
            'locale' => $locale,
        ];

        if ($isNewUser) {
            $attributes['tenant_id'] = $client->tenant_id;
            $attributes['is_active'] = true;
            $attributes['email_verification_required'] = true;
        }

        if ($password !== '') {
            $attributes['password'] = Hash::make($password);
        } elseif ($isNewUser) {
            throw ValidationException::withMessages([
                'portal_access.password' => ['A password is required when enabling portal access for a new client user.'],
            ]);
        }

        $user->forceFill($attributes)->save();

        if ($isNewUser) {
            $role = Role::query()->where('name', Role::CLIENT_USER)->firstOrFail();
            $user->roles()->syncWithoutDetaching([$role->id]);

            $tenantUser = TenantUser::query()
                ->where('tenant_id', $client->tenant_id)
                ->where('user_id', $user->id)
                ->first();

            if (! $tenantUser) {
                TenantUser::query()->forceCreate([
                    'tenant_id' => $client->tenant_id,
                    'user_id' => $user->id,
                    'role_id' => $role->id,
                    'is_primary' => true,
                    'joined_at' => now(),
                ]);
            } elseif (! $tenantUser->role_id) {
                $tenantUser->forceFill([
                    'role_id' => $role->id,
                ])->save();
            }
        }

        if ($client->user_id !== $user->id) {
            $client->forceFill(['user_id' => $user->id])->save();
        }

        $shouldSendVerification = (bool) ($portalAccess['send_verification_email'] ?? $isNewUser);

        if ($shouldSendVerification) {
            $this->emailVerification->send($user, $locale);
        }

        if ($isNewUser) {
            $tenant = Tenant::query()->withoutGlobalScopes()->find($client->tenant_id);

            if ($tenant) {
                $loginUrl = sprintf(
                    '%s/%s/auth/login',
                    rtrim((string) config('app.frontend_url'), '/'),
                    $locale,
                );

                $this->notifications->send(
                    email: $user->email,
                    event: NotificationEventCatalog::EVENT_CLIENT_ACCOUNT_CREATED,
                    context: [
                        'client' => [
                            'name' => $client->display_name,
                            'email' => $client->email,
                        ],
                        'tenant' => [
                            'name' => $tenant->name,
                        ],
                        'links' => [
                            'login_url' => $loginUrl,
                        ],
                    ],
                    tenant: $tenant,
                    locale: $locale,
                );
            }
        }
    }

    private function portalUserName(Client $client): string
    {
        $name = trim((string) ($client->display_name ?: 'Client User'));

        return $name !== '' ? $name : 'Client User';
    }
}
