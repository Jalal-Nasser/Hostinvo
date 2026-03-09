<?php

namespace Tests\Feature\Provisioning;

use App\Models\Client;
use App\Models\Product;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProvisioningSecretIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_plaintext_password_is_not_stored_in_provisioning_job_payloads(): void
    {
        $this->seed(RolePermissionSeeder::class);

        Http::fake([
            '*' => Http::response([
                'metadata' => [
                    'result' => 1,
                    'reason' => 'OK',
                    'command' => 'createacct',
                ],
                'data' => [
                    'user' => 'customer1',
                    'domain' => 'customer.example.test',
                    'ip' => '127.0.0.1',
                ],
            ], 200),
        ]);

        $tenant = Tenant::query()->create([
            'name' => 'Secure Provisioning',
            'slug' => 'secure-provisioning',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'provisioning-admin@example.test',
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

        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Acme Hosting',
            'email' => 'client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $product = Product::query()->create([
            'tenant_id' => $tenant->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Managed Hosting',
            'slug' => 'managed-hosting',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_PUBLIC,
            'display_order' => 0,
            'is_featured' => false,
        ]);

        Sanctum::actingAs($user);

        $serverId = $this->postJson('/api/v1/admin/servers', [
            'name' => 'Primary Node',
            'hostname' => 'node-1.example.test',
            'panel_type' => 'cpanel',
            'api_endpoint' => 'https://node-1.example.test:2087',
            'api_port' => 2087,
            'status' => 'active',
            'verify_ssl' => true,
            'max_accounts' => 250,
            'current_accounts' => 0,
            'username' => 'root',
            'credentials' => [
                'api_token' => 'placeholder-token',
            ],
            'packages' => [
                [
                    'product_id' => $product->id,
                    'panel_package_name' => 'managed_basic',
                    'display_name' => 'Managed Basic',
                    'is_default' => true,
                ],
            ],
        ])->assertCreated()->json('data.id');

        $serviceId = $this->postJson('/api/v1/admin/services', [
            'client_id' => $client->id,
            'product_id' => $product->id,
            'server_id' => $serverId,
            'billing_cycle' => 'monthly',
            'service_type' => 'hosting',
            'status' => 'pending',
            'provisioning_state' => 'idle',
            'domain' => 'customer.example.test',
            'username' => 'customer1',
        ])->assertCreated()->json('data.id');

        $response = $this->postJson("/api/v1/admin/services/{$serviceId}/operations/create_account", [
            'payload' => [
                'password' => 'UltraSecret987!',
            ],
        ]);

        $response->assertAccepted();

        $jobPayload = \App\Models\ProvisioningJob::query()
            ->where('service_id', $serviceId)
            ->latest('requested_at')
            ->firstOrFail()
            ->payload;

        $credential = \App\Models\ServiceCredential::query()
            ->where('service_id', $serviceId)
            ->firstOrFail();

        $this->assertArrayNotHasKey('password', $jobPayload);
        $this->assertNotSame('UltraSecret987!', $credential->value);
        $this->assertSame('UltraSecret987!', $credential->decryptValue());
        $this->assertNull($credential->credentials['password'] ?? null);
    }
}
