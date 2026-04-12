<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Models\UserMfaMethod;
use App\Services\Tenancy\TenantMfaPolicyService;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantMfaPolicyAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_login_requires_mfa_setup_when_policy_is_required(): void
    {
        [$tenant, $user] = $this->createTenantAdmin('required-policy');
        app(TenantMfaPolicyService::class)->updateTenantConfig($tenant, [
            'owner_admin' => TenantMfaPolicyService::REQUIRED,
            'staff' => TenantMfaPolicyService::DISABLED,
            'clients' => TenantMfaPolicyService::DISABLED,
        ]);

        $csrf = 'tenant-mfa-required';

        $this
            ->withHeaders($this->statefulHeaders($csrf))
            ->withSession(['_token' => $csrf])
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'password',
                'remember' => false,
            ])
            ->assertAccepted()
            ->assertJsonPath('data.status', 'mfa_setup_required');
    }

    public function test_tenant_admin_login_remains_password_only_when_policy_is_optional_without_enrolled_factor(): void
    {
        [$tenant, $user] = $this->createTenantAdmin('optional-policy');
        app(TenantMfaPolicyService::class)->updateTenantConfig($tenant, [
            'owner_admin' => TenantMfaPolicyService::OPTIONAL,
            'staff' => TenantMfaPolicyService::DISABLED,
            'clients' => TenantMfaPolicyService::DISABLED,
        ]);

        $csrf = 'tenant-mfa-optional';

        $this
            ->withHeaders($this->statefulHeaders($csrf))
            ->withSession(['_token' => $csrf])
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'password',
                'remember' => false,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'authenticated')
            ->assertJsonPath('data.user.id', $user->getKey());
    }

    public function test_tenant_admin_login_requires_mfa_challenge_when_optional_policy_user_already_has_totp(): void
    {
        [$tenant, $user] = $this->createTenantAdmin('optional-enrolled-policy');
        app(TenantMfaPolicyService::class)->updateTenantConfig($tenant, [
            'owner_admin' => TenantMfaPolicyService::OPTIONAL,
            'staff' => TenantMfaPolicyService::DISABLED,
            'clients' => TenantMfaPolicyService::DISABLED,
        ]);
        $this->addConfirmedTotp($user, 'JBSWY3DPEHPK3PXP');

        $csrf = 'tenant-mfa-optional-enrolled';

        $this
            ->withHeaders($this->statefulHeaders($csrf))
            ->withSession(['_token' => $csrf])
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'password',
                'remember' => false,
            ])
            ->assertAccepted()
            ->assertJsonPath('data.status', 'mfa_required');
    }

    private function createTenantAdmin(string $slug): array
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => ucfirst(str_replace('-', ' ', $slug)),
            'slug' => $slug,
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => "{$slug}@gmail.com",
            'email_verified_at' => now(),
            'email_verification_required' => false,
            'is_active' => true,
        ]);

        $role = Role::query()->where('name', Role::TENANT_ADMIN)->firstOrFail();
        $user->roles()->attach($role);

        TenantUser::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        $user->load('roles');

        return [$tenant, $user];
    }

    private function addConfirmedTotp(User $user, string $secret): void
    {
        UserMfaMethod::query()->create([
            'user_id' => $user->getKey(),
            'type' => UserMfaMethod::TYPE_TOTP,
            'label' => 'Authenticator',
            'secret' => encrypt($secret),
            'metadata' => ['issuer' => 'Hostinvo'],
            'confirmed_at' => now(),
            'last_used_at' => now(),
        ]);
    }

    private function statefulHeaders(string $csrf): array
    {
        return [
            'Origin' => 'http://localhost:3000',
            'Referer' => 'http://localhost:3000/en/auth/login',
            'Accept' => 'application/json',
            'X-Requested-With' => 'XMLHttpRequest',
            'X-CSRF-TOKEN' => $csrf,
        ];
    }
}
