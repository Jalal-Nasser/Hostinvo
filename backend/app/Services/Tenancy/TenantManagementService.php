<?php

namespace App\Services\Tenancy;

use App\Models\License;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Licensing\LicenseService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TenantManagementService
{
    public function __construct(
        private readonly LicenseService $licenseService,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = Tenant::query()
            ->with(['owner', 'latestLicense'])
            ->withCount('users')
            ->latest('created_at');

        if (filled($filters['search'] ?? null)) {
            $search = trim((string) $filters['search']);

            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('primary_domain', 'like', "%{$search}%")
                    ->orWhereHas('owner', function ($ownerQuery) use ($search): void {
                        $ownerQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if (filled($filters['status'] ?? null)) {
            $query->where('status', (string) $filters['status']);
        }

        if (filled($filters['plan'] ?? null)) {
            $query->where('plan', (string) $filters['plan']);
        }

        return $query->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function getForDisplay(Tenant $tenant): Tenant
    {
        return Tenant::query()
            ->with([
                'owner',
                'latestLicense',
                'tenantUsers.role',
                'tenantUsers.user',
            ])
            ->withCount('users')
            ->find($tenant->getKey()) ?? $tenant->loadMissing(['owner', 'latestLicense']);
    }

    public function create(array $payload): Tenant
    {
        return DB::transaction(function () use ($payload): Tenant {
            $tenant = Tenant::query()->create([
                'name' => trim((string) $payload['name']),
                'slug' => $this->resolveUniqueSlug(
                    (string) ($payload['slug'] ?? ''),
                    (string) $payload['name'],
                ),
                'plan' => License::PLAN_FREE_TRIAL,
                'status' => (string) ($payload['status'] ?? 'active'),
                'primary_domain' => Str::lower(trim((string) $payload['primary_domain'])),
                'default_locale' => (string) ($payload['default_locale'] ?? 'en'),
                'default_currency' => Str::upper((string) ($payload['default_currency'] ?? 'USD')),
                'timezone' => (string) ($payload['timezone'] ?? 'UTC'),
            ]);

            $owner = new User();
            $owner->forceFill([
                'tenant_id' => $tenant->id,
                'name' => trim((string) $payload['owner_name']),
                'email' => Str::lower(trim((string) $payload['owner_email'])),
                'password' => Hash::make((string) $payload['owner_password']),
                'locale' => (string) ($payload['default_locale'] ?? 'en'),
                'is_active' => true,
            ]);
            $owner->save();

            $tenant->forceFill([
                'owner_user_id' => $owner->id,
            ])->save();

            $ownerRole = $this->tenantOwnerRole();
            $owner->roles()->syncWithoutDetaching([$ownerRole->id]);

            $tenantUser = TenantUser::query()->firstOrNew([
                'tenant_id' => $tenant->id,
                'user_id' => $owner->id,
            ]);

            $tenantUser->forceFill([
                'tenant_id' => $tenant->id,
                'user_id' => $owner->id,
                'role_id' => $ownerRole->id,
                'is_primary' => true,
                'joined_at' => now(),
            ]);
            $tenantUser->save();

            $license = $this->licenseService->issueTrialLicense(
                ownerEmail: $owner->email,
                domain: $tenant->primary_domain ?? $tenant->slug,
                instanceFingerprint: sha1(($tenant->primary_domain ?? $tenant->slug).'|'.$tenant->slug),
                tenantId: $tenant->id,
            );

            $tenant->plan = (string) data_get(
                $license,
                'license.license_type',
                License::PLAN_FREE_TRIAL,
            );
            $tenant->save();

            return $this->getForDisplay($tenant);
        });
    }

    public function update(Tenant $tenant, array $payload): Tenant
    {
        return DB::transaction(function () use ($tenant, $payload): Tenant {
            $tenant->fill([
                'name' => trim((string) $payload['name']),
                'slug' => filled($payload['slug'] ?? null)
                    ? Str::slug((string) $payload['slug'])
                    : $tenant->slug,
                'status' => (string) ($payload['status'] ?? $tenant->status),
                'primary_domain' => filled($payload['primary_domain'] ?? null)
                    ? Str::lower(trim((string) $payload['primary_domain']))
                    : null,
                'default_locale' => (string) ($payload['default_locale'] ?? $tenant->default_locale),
                'default_currency' => Str::upper((string) ($payload['default_currency'] ?? $tenant->default_currency)),
                'timezone' => (string) ($payload['timezone'] ?? $tenant->timezone),
            ]);
            $tenant->save();

            $owner = $tenant->owner;

            if ($owner) {
                $owner->forceFill([
                    'name' => trim((string) ($payload['owner_name'] ?? $owner->name)),
                    'email' => Str::lower(trim((string) ($payload['owner_email'] ?? $owner->email))),
                    'locale' => (string) ($payload['default_locale'] ?? $owner->locale ?? $tenant->default_locale),
                ]);

                if (filled($payload['owner_password'] ?? null)) {
                    $owner->password = Hash::make((string) $payload['owner_password']);
                }

                $owner->save();
            }

            return $this->getForDisplay($tenant);
        });
    }

    public function activate(Tenant $tenant): Tenant
    {
        return $this->setStatus($tenant, 'active');
    }

    public function suspend(Tenant $tenant): Tenant
    {
        return $this->setStatus($tenant, 'suspended');
    }

    public function resolveImpersonationUser(Tenant $tenant): ?User
    {
        if ($tenant->relationLoaded('owner') && $tenant->owner) {
            return $tenant->owner;
        }

        $tenant->loadMissing('owner');

        if ($tenant->owner) {
            return $tenant->owner;
        }

        $ownerRole = $this->tenantOwnerRole();

        $owner = User::query()
            ->where('tenant_id', $tenant->id)
            ->whereHas('roles', function ($query) use ($ownerRole): void {
                $query->where('roles.id', $ownerRole->id);
            })
            ->first();

        if ($owner) {
            return $owner;
        }

        return User::query()
            ->where('tenant_id', $tenant->id)
            ->orderBy('created_at')
            ->first();
    }

    private function setStatus(Tenant $tenant, string $status): Tenant
    {
        $tenant->forceFill([
            'status' => $status,
        ])->save();

        return $this->getForDisplay($tenant);
    }

    private function resolveUniqueSlug(string $requestedSlug, string $name): string
    {
        $baseSlug = Str::slug(trim($requestedSlug) !== '' ? $requestedSlug : $name);

        if ($baseSlug === '') {
            $baseSlug = 'tenant';
        }

        $slug = $baseSlug;
        $counter = 2;

        while (Tenant::query()->where('slug', $slug)->exists()) {
            $slug = sprintf('%s-%d', $baseSlug, $counter);
            $counter++;
        }

        return $slug;
    }

    private function tenantOwnerRole(): Role
    {
        $role = Role::query()
            ->whereNull('tenant_id')
            ->where('name', Role::TENANT_OWNER)
            ->first();

        if ($role) {
            return $role;
        }

        throw ValidationException::withMessages([
            'role' => ['Tenant owner role is not configured. Run the role seeder first.'],
        ]);
    }
}
