<?php

namespace Tests\Feature\Admin;

use App\Models\License;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Tenancy\TenantContextService;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DemoTenantContextTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_super_admin_can_open_demo_tenant_context_without_existing_customer_tenant(): void
    {
        $superAdmin = User::factory()->create([
            'tenant_id' => null,
            'email' => 'platform-owner@example.test',
        ]);
        $superAdmin->assignRole(Role::SUPER_ADMIN);

        Sanctum::actingAs($superAdmin);

        $response = $this
            ->withHeader('Host', 'admin.hostinvo.test')
            ->withSession([])
            ->postJson('/api/v1/admin/demo-tenant/switch');

        $response
            ->assertOk()
            ->assertJsonPath('data.tenant.slug', 'hostinvo-demo')
            ->assertJsonPath('data.owner.email', 'demo-owner@hostinvo.local');

        $tenant = Tenant::query()->where('slug', 'hostinvo-demo')->firstOrFail();

        $this->assertSame(
            $tenant->id,
            session(TenantContextService::ACTIVE_TENANT_SESSION_KEY),
        );
        $this->assertSame('Hostinvo Demo Tenant', $tenant->name);
        $this->assertSame('active', $tenant->status);

        $this->assertDatabaseHas('users', [
            'tenant_id' => $tenant->id,
            'email' => 'demo-owner@hostinvo.local',
            'is_active' => true,
        ]);
        $this->assertDatabaseHas('licenses', [
            'tenant_id' => $tenant->id,
            'license_key' => 'HOST-DEMO-DEVELOPMENT',
            'plan' => License::PLAN_PROFESSIONAL,
            'status' => License::STATUS_ACTIVE,
            'domain' => 'localhost',
        ]);
    }

    public function test_demo_tenant_switch_is_idempotent(): void
    {
        $superAdmin = User::factory()->create([
            'tenant_id' => null,
            'email' => 'platform-owner@example.test',
        ]);
        $superAdmin->assignRole(Role::SUPER_ADMIN);

        Sanctum::actingAs($superAdmin);

        $this
            ->withHeader('Host', 'admin.hostinvo.test')
            ->withSession([])
            ->postJson('/api/v1/admin/demo-tenant/switch')
            ->assertOk();

        $this
            ->withHeader('Host', 'admin.hostinvo.test')
            ->postJson('/api/v1/admin/demo-tenant/switch')
            ->assertOk();

        $tenant = Tenant::query()->where('slug', 'hostinvo-demo')->firstOrFail();

        $this->assertSame(1, Tenant::query()->where('slug', 'hostinvo-demo')->count());
        $this->assertSame(
            1,
            User::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('email', 'demo-owner@hostinvo.local')
                ->count(),
        );
        $this->assertSame(
            1,
            License::query()
                ->where('tenant_id', $tenant->id)
                ->where('license_key', 'HOST-DEMO-DEVELOPMENT')
                ->count(),
        );
    }
}
