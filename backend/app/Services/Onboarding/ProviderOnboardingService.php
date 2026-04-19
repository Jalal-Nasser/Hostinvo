<?php

namespace App\Services\Onboarding;

use App\Models\License;
use App\Models\Product;
use App\Models\Role;
use App\Models\Server;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Auth\EmailVerificationService;
use App\Services\Licensing\LicenseService;
use App\Services\Notifications\NotificationDispatchService;
use App\Services\Notifications\NotificationEventCatalog;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProviderOnboardingService
{
    public function __construct(
        private readonly LicenseService $licenseService,
        private readonly EmailVerificationService $emailVerification,
        private readonly NotificationDispatchService $notifications,
    ) {
    }

    /**
     * @return array{user:User, license:array<string,mixed>|null}
     */
    public function registerProvider(array $payload, Request $request): array
    {
        return DB::transaction(function () use ($payload, $request): array {
            $tenant = Tenant::query()->create([
                'name' => trim((string) $payload['company_name']),
                'slug' => $this->resolveUniqueTenantSlug((string) $payload['company_name']),
                'plan' => License::PLAN_FREE_TRIAL,
                'status' => 'active',
                'primary_domain' => $payload['company_domain'] ?? null,
                'default_locale' => $payload['default_locale'] ?? 'en',
                'default_currency' => Str::upper((string) ($payload['default_currency'] ?? 'USD')),
                'timezone' => $payload['timezone'] ?? 'UTC',
            ]);

            $user = new User();
            $user->forceFill([
                'tenant_id' => $tenant->id,
                'name' => trim((string) $payload['name']),
                'email' => Str::lower(trim((string) $payload['email'])),
                'password' => (string) $payload['password'],
                'locale' => $payload['default_locale'] ?? 'en',
                'is_active' => true,
                'email_verification_required' => true,
                'email_verified_at' => null,
            ]);
            $user->save();

            $tenant->forceFill([
                'owner_user_id' => $user->id,
            ]);
            $tenant->save();

            $role = Role::query()
                ->whereNull('tenant_id')
                ->where('name', Role::TENANT_OWNER)
                ->first();

            if (! $role) {
                app(RolePermissionSeeder::class)->run();

                $role = Role::query()
                    ->whereNull('tenant_id')
                    ->where('name', Role::TENANT_OWNER)
                    ->first();
            }

            if (! $role) {
                throw ValidationException::withMessages([
                    'role' => ['Tenant owner role is not configured. Run the role seeder first.'],
                ]);
            }

            $user->roles()->syncWithoutDetaching([$role->id]);

            TenantUser::query()->forceCreate([
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
                'role_id' => $role->id,
                'is_primary' => true,
                'joined_at' => now(),
            ]);

            $licensePayload = null;
            $licenseDomain = Str::lower(trim((string) ($payload['company_domain'] ?? $request->getHost())));
            $instanceFingerprint = filled($payload['license_instance_id'] ?? null)
                ? (string) $payload['license_instance_id']
                : sha1($licenseDomain.'|'.$tenant->slug);

            if (filled($payload['license_key'] ?? null)) {
                $licensePayload = $this->licenseService->activateLicense(
                    licenseKey: (string) $payload['license_key'],
                    domain: (string) ($payload['license_domain'] ?? $licenseDomain),
                    instanceId: (string) $instanceFingerprint,
                    tenantId: $tenant->id,
                );
            } else {
                $licensePayload = $this->licenseService->issueTrialLicense(
                    ownerEmail: $user->email,
                    domain: $licenseDomain,
                    instanceFingerprint: $instanceFingerprint,
                    tenantId: $tenant->id,
                );
            }

            $tenant->plan = (string) data_get(
                $licensePayload,
                'license.license_type',
                data_get($licensePayload, 'license.plan', License::PLAN_FREE_TRIAL),
            );
            $tenant->save();

            $this->emailVerification->send($user, $tenant->default_locale);
            $this->notifications->send(
                email: $user->email,
                event: NotificationEventCatalog::EVENT_FREE_TRIAL_WELCOME,
                context: [
                    'user' => [
                        'name' => $user->name,
                        'email' => $user->email,
                    ],
                    'tenant' => [
                        'name' => $tenant->name,
                    ],
                    'license' => [
                        'expires_at' => data_get($licensePayload, 'license.expires_at'),
                    ],
                    'links' => [
                        'login_url' => rtrim((string) config('app.marketing_url', config('app.frontend_url')), '/')
                            .'/'.$tenant->default_locale.'/auth/login',
                    ],
                ],
                tenant: $tenant,
                locale: $tenant->default_locale,
            );

            return [
                'user' => $user->loadMissing(['tenant', 'roles.permissions']),
                'license' => $licensePayload,
                'verification_required' => true,
            ];
        });
    }

    public function updateCompany(User $user, array $payload): Tenant
    {
        $tenant = $user->tenant;

        if (! $tenant) {
            throw ValidationException::withMessages([
                'tenant' => ['Tenant context is required to update company details.'],
            ]);
        }

        $tenant->fill([
            'name' => trim((string) $payload['company_name']),
            'primary_domain' => Str::lower(trim((string) $payload['company_domain'])),
            'default_locale' => $payload['default_locale'],
            'default_currency' => Str::upper((string) $payload['default_currency']),
            'timezone' => $payload['timezone'],
        ]);
        $tenant->save();

        return $tenant->fresh();
    }

    /**
     * @return array<string, mixed>
     */
    public function status(User $user): array
    {
        $tenant = $user->tenant;

        if (! $tenant) {
            throw ValidationException::withMessages([
                'tenant' => ['Tenant context is required for onboarding status.'],
            ]);
        }

        $companyConfigured = filled($tenant->name) && filled($tenant->primary_domain);
        $hasServer = Server::query()->where('tenant_id', $tenant->id)->exists();
        $hasProduct = Product::query()->where('tenant_id', $tenant->id)->exists();
        $license = License::query()
            ->where('tenant_id', $tenant->id)
            ->latest('issued_at')
            ->first();

        $steps = [
            ['key' => 'create_account', 'complete' => true],
            ['key' => 'configure_company', 'complete' => $companyConfigured],
            ['key' => 'add_first_server', 'complete' => $hasServer],
            ['key' => 'create_first_product', 'complete' => $hasProduct],
        ];

        $completedSteps = collect($steps)
            ->where('complete', true)
            ->count();

        return [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'primary_domain' => $tenant->primary_domain,
                'default_locale' => $tenant->default_locale,
                'default_currency' => $tenant->default_currency,
                'timezone' => $tenant->timezone,
            ],
            'license' => $license ? [
                'plan' => $license->effectivePlan(),
                'license_type' => $license->effectivePlan(),
                'status' => $license->status,
                'max_clients' => $license->max_clients,
                'max_services' => $license->max_services,
                'expires_at' => $license->expires_at?->toIso8601String(),
                'is_trial' => $license->isTrial(),
                'last_verified_at' => $license->last_verified_at?->toIso8601String(),
                'verification_grace_ends_at' => $license->verification_grace_ends_at?->toIso8601String(),
                'bound_domain' => $license->bound_domain,
            ] : null,
            'steps' => $steps,
            'progress' => [
                'completed' => $completedSteps,
                'total' => count($steps),
                'percent' => count($steps) > 0
                    ? (int) floor(($completedSteps / count($steps)) * 100)
                    : 0,
            ],
            'is_complete' => $completedSteps === count($steps),
        ];
    }

    private function resolveUniqueTenantSlug(string $companyName): string
    {
        $base = Str::slug($companyName);
        $base = $base !== '' ? $base : 'hostinvo-provider';
        $slug = $base;
        $counter = 1;

        while (Tenant::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
