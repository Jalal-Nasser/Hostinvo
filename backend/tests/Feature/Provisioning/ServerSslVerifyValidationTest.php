<?php

namespace Tests\Feature\Provisioning;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ServerSslVerifyValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_ssl_verification_cannot_be_disabled_in_production(): void
    {
        $this->seed(RolePermissionSeeder::class);
        config(['app.env' => 'production']);

        $tenant = Tenant::query()->create([
            'name' => 'Production Tenant',
            'slug' => 'production-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'tenant-admin@example.test',
        ]);

        $role = Role::query()->where('name', Role::TENANT_ADMIN)->firstOrFail();
        $user->roles()->attach($role);

        TenantUser::query()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/admin/servers', [
            'name' => 'Insecure Node',
            'hostname' => 'node-1.example.test',
            'panel_type' => 'cpanel',
            'api_endpoint' => 'https://node-1.example.test:2087',
            'api_port' => 2087,
            'status' => 'active',
            'verify_ssl' => false,
            'username' => 'root',
            'credentials' => [
                'api_token' => 'placeholder-token',
            ],
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['verify_ssl']);
    }
}
