<?php

namespace Tests\Feature\Security;

use App\Models\Client;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiRateLimitingTest extends TestCase
{
    use RefreshDatabase;

    public function test_auth_endpoints_are_rate_limited_after_ten_requests_per_ip(): void
    {
        $ipAddress = '203.0.113.10';

        for ($attempt = 0; $attempt < 10; $attempt++) {
            $this->withServerVariables([
                'REMOTE_ADDR' => $ipAddress,
            ])->postJson('/api/v1/auth/forgot-password', [
                'email' => 'missing-user@example.test',
            ])->assertOk();
        }

        $this->withServerVariables([
            'REMOTE_ADDR' => $ipAddress,
        ])->postJson('/api/v1/auth/forgot-password', [
            'email' => 'missing-user@example.test',
        ])->assertStatus(429)
            ->assertJsonPath('errors.0.message', 'Too many requests. Please try again later.');
    }

    public function test_webhook_endpoints_are_rate_limited_after_ten_requests_per_ip(): void
    {
        $ipAddress = '203.0.113.20';

        for ($attempt = 0; $attempt < 10; $attempt++) {
            $this->withServerVariables([
                'REMOTE_ADDR' => $ipAddress,
            ])->postJson('/api/v1/webhooks/stripe', [], [
                'Stripe-Signature' => 'v1=invalid_signature',
            ])->assertStatus(400);
        }

        $this->withServerVariables([
            'REMOTE_ADDR' => $ipAddress,
        ])->postJson('/api/v1/webhooks/stripe', [], [
            'Stripe-Signature' => 'v1=invalid_signature',
        ])->assertStatus(429)
            ->assertJsonPath('errors.0.message', 'Too many requests. Please try again later.');
    }

    public function test_ticket_creation_endpoint_is_rate_limited_after_ten_requests_per_user(): void
    {
        $this->seed(RolePermissionSeeder::class);

        [$tenant, $user] = $this->createTenantAdminContext('ticket-create-rate-limit');
        $client = $this->createClient($tenant, 'tickets@example.test');

        Sanctum::actingAs($user);

        for ($attempt = 0; $attempt < 10; $attempt++) {
            $this->postJson('/api/v1/admin/tickets', [
                'client_id' => $client->id,
                'subject' => "Rate limited ticket {$attempt}",
                'priority' => 'medium',
                'message' => 'Ticket body content.',
            ])->assertCreated();
        }

        $this->postJson('/api/v1/admin/tickets', [
            'client_id' => $client->id,
            'subject' => 'Rate limited ticket overflow',
            'priority' => 'medium',
            'message' => 'Ticket body content.',
        ])->assertStatus(429)
            ->assertJsonPath('errors.0.message', 'Too many requests. Please try again later.');
    }

    public function test_ticket_reply_endpoint_is_rate_limited_after_ten_requests_per_user(): void
    {
        $this->seed(RolePermissionSeeder::class);

        [$tenant, $user] = $this->createTenantAdminContext('ticket-reply-rate-limit');
        $client = $this->createClient($tenant, 'ticket-replies@example.test');

        Sanctum::actingAs($user);

        $ticketId = $this->postJson('/api/v1/admin/tickets', [
            'client_id' => $client->id,
            'subject' => 'Reply rate limit ticket',
            'priority' => 'medium',
            'message' => 'Initial message.',
        ])->assertCreated()
            ->json('data.id');

        for ($attempt = 0; $attempt < 10; $attempt++) {
            $this->postJson("/api/v1/admin/tickets/{$ticketId}/replies", [
                'message' => "Reply {$attempt}",
            ])->assertOk();
        }

        $this->postJson("/api/v1/admin/tickets/{$ticketId}/replies", [
            'message' => 'Reply overflow',
        ])->assertStatus(429)
            ->assertJsonPath('errors.0.message', 'Too many requests. Please try again later.');
    }

    private function createTenantAdminContext(string $slug): array
    {
        $tenant = Tenant::query()->create([
            'name' => str_replace('-', ' ', ucfirst($slug)),
            'slug' => $slug,
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => "{$slug}@example.test",
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

        return [$tenant, $user];
    }

    private function createClient(Tenant $tenant, string $email): Client
    {
        return Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Rate Limited Client',
            'email' => $email,
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);
    }
}
