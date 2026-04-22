<?php

namespace App\Services\Tenancy;

use App\Models\License;
use App\Models\LicenseActivation;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Licensing\LicenseService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoTenantService
{
    private const TENANT_SLUG = 'hostinvo-demo';
    private const OWNER_EMAIL = 'demo-owner@hostinvo.local';
    private const LICENSE_KEY = 'HOST-DEMO-DEVELOPMENT';

    public function __construct(
        private readonly LicenseService $licenseService,
    ) {
    }

    public function ensure(string $requestHost): Tenant
    {
        return DB::transaction(function () use ($requestHost): Tenant {
            $tenant = Tenant::withTrashed()
                ->where('slug', self::TENANT_SLUG)
                ->first() ?? new Tenant();

            if (method_exists($tenant, 'trashed') && $tenant->trashed()) {
                $tenant->restore();
            }

            $tenant->forceFill([
                'name' => 'Hostinvo Demo Tenant',
                'slug' => self::TENANT_SLUG,
                'plan' => License::PLAN_PROFESSIONAL,
                'status' => 'active',
                'primary_domain' => null,
                'default_locale' => 'en',
                'default_currency' => 'USD',
                'timezone' => 'UTC',
            ]);
            $tenant->save();

            $owner = User::withoutGlobalScopes()
                ->withTrashed()
                ->where('tenant_id', $tenant->id)
                ->where('email', self::OWNER_EMAIL)
                ->first() ?? new User();

            if (method_exists($owner, 'trashed') && $owner->trashed()) {
                $owner->restore();
            }

            $owner->forceFill([
                'tenant_id' => $tenant->id,
                'name' => 'Demo Tenant Owner',
                'email' => self::OWNER_EMAIL,
                'password' => $owner->exists
                    ? $owner->password
                    : Hash::make(Str::password(32)),
                'locale' => 'en',
                'is_active' => true,
                'email_verification_required' => false,
                'email_verified_at' => $owner->email_verified_at ?? now(),
            ]);
            $owner->save();

            $tenant->forceFill([
                'owner_user_id' => $owner->id,
            ])->save();

            $ownerRole = Role::query()
                ->where('name', Role::TENANT_OWNER)
                ->first();

            if ($ownerRole) {
                $owner->roles()->syncWithoutDetaching([$ownerRole->id]);

                $tenantUser = TenantUser::query()
                    ->withoutGlobalScopes()
                    ->where('tenant_id', $tenant->id)
                    ->where('user_id', $owner->id)
                    ->first() ?? new TenantUser();

                $tenantUser->forceFill([
                    'tenant_id' => $tenant->id,
                    'user_id' => $owner->id,
                    'role_id' => $ownerRole->id,
                    'is_primary' => true,
                    'joined_at' => $tenantUser->joined_at ?? now(),
                ]);
                $tenantUser->save();
            }

            $this->ensureLicense($tenant, $requestHost);

            return $tenant->fresh(['owner', 'latestLicense']) ?? $tenant;
        });
    }

    private function ensureLicense(Tenant $tenant, string $requestHost): void
    {
        $domain = $this->normalizeHost($requestHost);
        $fingerprint = $this->licenseService->generateInstallationHash($domain);
        $issuedAt = now();

        $license = License::query()
            ->where('license_key', self::LICENSE_KEY)
            ->first() ?? new License();

        $license->forceFill([
            'tenant_id' => $tenant->id,
            'license_key' => self::LICENSE_KEY,
            'owner_email' => self::OWNER_EMAIL,
            'type' => License::PLAN_PROFESSIONAL,
            'license_type' => License::PLAN_PROFESSIONAL,
            'plan' => License::PLAN_PROFESSIONAL,
            'status' => License::STATUS_ACTIVE,
            'domain' => $domain,
            'bound_domain' => $domain,
            'installation_hash' => $fingerprint,
            'instance_fingerprint' => $fingerprint,
            'max_clients' => null,
            'max_services' => null,
            'activation_limit' => null,
            'issued_at' => $license->issued_at ?? $issuedAt,
            'expires_at' => null,
            'last_validated_at' => $issuedAt,
            'last_verified_at' => $issuedAt,
            'verification_grace_ends_at' => $issuedAt->copy()->addYear(),
            'metadata' => array_merge((array) ($license->metadata ?? []), [
                'source' => 'demo_tenant',
                'verification_mode' => 'local',
            ]),
        ]);
        $license->save();

        $activation = LicenseActivation::query()
            ->where('license_id', $license->id)
            ->where('instance_id', $fingerprint)
            ->first() ?? new LicenseActivation();

        $activation->forceFill([
            'license_id' => $license->id,
            'tenant_id' => $tenant->id,
            'domain' => $domain,
            'instance_id' => $fingerprint,
            'instance_fingerprint' => $fingerprint,
            'status' => LicenseActivation::STATUS_ACTIVE,
            'activated_at' => $activation->activated_at ?? $issuedAt,
            'last_seen_at' => $issuedAt,
            'deactivated_at' => null,
            'metadata' => array_merge((array) ($activation->metadata ?? []), [
                'source' => 'demo_tenant',
            ]),
        ]);
        $activation->save();
    }

    private function normalizeHost(string $host): string
    {
        $normalized = Str::lower(trim($host));

        return preg_replace('/:\d+$/', '', $normalized) ?: 'localhost';
    }
}
