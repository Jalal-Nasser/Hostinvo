<?php

namespace Database\Seeders\Beta;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Tenancy\TenantSettingService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class BetaTenantSeeder extends Seeder
{
    public function run(): void
    {
        $ownerRole = Role::query()
            ->whereNull('tenant_id')
            ->where('name', Role::TENANT_OWNER)
            ->first();

        if (! $ownerRole) {
            return;
        }

        $tenantSettingService = app(TenantSettingService::class);

        $tenants = [
            [
                'name' => 'Beta Alpha Hosting',
                'slug' => 'beta-alpha',
                'owner_name' => 'Beta Alpha Owner',
                'owner_email' => 'owner+beta-alpha@hostinvo.test',
                'primary_domain' => 'beta-alpha.hostinvo.test',
                'default_locale' => 'en',
                'timezone' => 'UTC',
            ],
            [
                'name' => 'Beta Arabia Hosting',
                'slug' => 'beta-arabia',
                'owner_name' => 'Beta Arabia Owner',
                'owner_email' => 'owner+beta-arabia@hostinvo.test',
                'primary_domain' => 'beta-arabia.hostinvo.test',
                'default_locale' => 'ar',
                'timezone' => 'Asia/Riyadh',
            ],
        ];

        foreach ($tenants as $definition) {
            $tenant = Tenant::query()->updateOrCreate(
                ['slug' => $definition['slug']],
                [
                    'name' => $definition['name'],
                    'plan' => 'beta',
                    'status' => 'active',
                    'primary_domain' => $definition['primary_domain'],
                    'default_locale' => $definition['default_locale'],
                    'default_currency' => 'USD',
                    'timezone' => $definition['timezone'],
                ]
            );

            $owner = User::query()->where('email', $definition['owner_email'])->first() ?? new User();
            $owner->forceFill([
                'tenant_id' => $tenant->id,
                'name' => $definition['owner_name'],
                'email' => $definition['owner_email'],
                'locale' => $definition['default_locale'],
                'password' => Hash::make('BetaPass123!'),
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
            $owner->save();

            $owner->roles()->syncWithoutDetaching([$ownerRole->id]);

            TenantUser::query()->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'user_id' => $owner->id,
                ],
                [
                    'role_id' => $ownerRole->id,
                    'is_primary' => true,
                    'joined_at' => now(),
                ],
            );

            if ($tenant->owner_user_id !== $owner->id) {
                $tenant->forceFill(['owner_user_id' => $owner->id])->save();
            }

            $tenantSettingService->put($tenant, 'payments.stripe.enabled', false);
            $tenantSettingService->put($tenant, 'payments.paypal.enabled', false);
            $tenantSettingService->put($tenant, 'payments.paypal.mode', 'sandbox');
            $tenantSettingService->put($tenant, 'payments.stripe.publishable_key', 'pk_test_beta_placeholder', true);
            $tenantSettingService->put($tenant, 'payments.stripe.secret_key', 'sk_test_beta_placeholder', true);
            $tenantSettingService->put($tenant, 'payments.stripe.webhook_secret', 'whsec_beta_placeholder', true);
            $tenantSettingService->put($tenant, 'payments.paypal.client_id', 'beta-paypal-client-id', true);
            $tenantSettingService->put($tenant, 'payments.paypal.client_secret', 'beta-paypal-client-secret', true);
            $tenantSettingService->put($tenant, 'payments.paypal.webhook_id', 'beta-paypal-webhook-id', true);
        }
    }
}

