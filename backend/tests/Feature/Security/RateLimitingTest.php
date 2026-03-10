<?php

namespace Tests\Feature\Security;

use App\Models\Client;
use App\Models\Domain;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RateLimitingTest extends TestCase
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

        $response = $this->withServerVariables([
            'REMOTE_ADDR' => $ipAddress,
        ])->postJson('/api/v1/auth/forgot-password', [
            'email' => 'missing-user@example.test',
        ]);

        $this->assertThrottleResponse($response);
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

        $response = $this->withServerVariables([
            'REMOTE_ADDR' => $ipAddress,
        ])->postJson('/api/v1/webhooks/stripe', [], [
            'Stripe-Signature' => 'v1=invalid_signature',
        ]);

        $this->assertThrottleResponse($response);
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

        $response = $this->postJson('/api/v1/admin/tickets', [
            'client_id' => $client->id,
            'subject' => 'Rate limited ticket overflow',
            'priority' => 'medium',
            'message' => 'Ticket body content.',
        ]);

        $this->assertThrottleResponse($response);
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

        $response = $this->postJson("/api/v1/admin/tickets/{$ticketId}/replies", [
            'message' => 'Reply overflow',
        ]);

        $this->assertThrottleResponse($response);
    }

    public function test_domain_action_endpoints_are_rate_limited_after_twenty_requests_per_user(): void
    {
        $this->seed(RolePermissionSeeder::class);

        [$tenant, $storeUser] = $this->createTenantAdminContext('domain-actions-store-rate-limit');
        $client = $this->createClient($tenant, 'domain-actions@example.test');

        Sanctum::actingAs($storeUser);

        for ($attempt = 0; $attempt < 20; $attempt++) {
            $this->postJson('/api/v1/admin/domains', $this->domainPayload(
                $client->id,
                "domain-actions-store-{$attempt}.test",
            ))->assertCreated();
        }

        $this->assertThrottleResponse(
            $this->postJson('/api/v1/admin/domains', $this->domainPayload(
                $client->id,
                'domain-actions-store-overflow.test',
            ))
        );

        $updateUser = $this->createTenantAdminUser($tenant, 'domain-actions-update-rate-limit');
        $domain = $this->createDomain($tenant, $client, 'domain-actions-update-target.test');

        Sanctum::actingAs($updateUser);

        for ($attempt = 0; $attempt < 20; $attempt++) {
            $this->putJson("/api/v1/admin/domains/{$domain->id}", $this->domainPayload(
                $client->id,
                'domain-actions-update-target.test',
                [
                    'notes' => "Update attempt {$attempt}",
                ],
            ))->assertOk();
        }

        $this->assertThrottleResponse(
            $this->putJson("/api/v1/admin/domains/{$domain->id}", $this->domainPayload(
                $client->id,
                'domain-actions-update-target.test',
                [
                    'notes' => 'Update overflow',
                ],
            ))
        );

        $destroyUser = $this->createTenantAdminUser($tenant, 'domain-actions-destroy-rate-limit');
        $domainsToDelete = [];

        for ($attempt = 0; $attempt < 21; $attempt++) {
            $domainsToDelete[] = $this->createDomain(
                $tenant,
                $client,
                "domain-actions-destroy-{$attempt}.test",
            );
        }

        Sanctum::actingAs($destroyUser);

        for ($attempt = 0; $attempt < 20; $attempt++) {
            $this->deleteJson("/api/v1/admin/domains/{$domainsToDelete[$attempt]->id}")
                ->assertNoContent();
        }

        $this->assertThrottleResponse(
            $this->deleteJson("/api/v1/admin/domains/{$domainsToDelete[20]->id}")
        );
    }

    public function test_domain_list_endpoint_is_rate_limited_after_thirty_requests_per_user(): void
    {
        $this->seed(RolePermissionSeeder::class);

        [$tenant, $user] = $this->createTenantAdminContext('domain-list-rate-limit');
        $client = $this->createClient($tenant, 'domain-list@example.test');
        $this->createDomain($tenant, $client, 'domain-list-seed.test');

        Sanctum::actingAs($user);

        for ($attempt = 0; $attempt < 30; $attempt++) {
            $this->getJson('/api/v1/admin/domains')->assertOk();
        }

        $this->assertThrottleResponse(
            $this->getJson('/api/v1/admin/domains')
        );
    }

    public function test_authenticated_api_baseline_is_rate_limited_at_sixty_requests_per_user(): void
    {
        $this->seed(RolePermissionSeeder::class);

        [, $user] = $this->createTenantAdminContext('api-baseline-rate-limit');

        Sanctum::actingAs($user);

        for ($attempt = 0; $attempt < 60; $attempt++) {
            $this->getJson('/api/v1/admin/clients')->assertOk();
        }

        $this->assertThrottleResponse(
            $this->getJson('/api/v1/admin/clients')
        );
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

    private function createTenantAdminUser(Tenant $tenant, string $slug): User
    {
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
            'is_primary' => false,
            'joined_at' => now(),
        ]);

        return $user;
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

    private function domainPayload(string $clientId, string $fqdn, array $overrides = []): array
    {
        $parts = explode('.', strtolower($fqdn), 2);
        $tld = $parts[1] ?? 'test';

        return array_merge([
            'client_id' => $clientId,
            'domain' => $fqdn,
            'tld' => $tld,
            'status' => Domain::STATUS_ACTIVE,
            'registrar' => 'Manual Registrar',
            'registration_date' => now()->toDateString(),
            'expiry_date' => now()->addYear()->toDateString(),
            'auto_renew' => true,
            'dns_management' => true,
            'id_protection' => false,
            'renewal_price' => 1000,
            'currency' => 'USD',
            'notes' => 'Rate limiting verification.',
        ], $overrides);
    }

    private function createDomain(Tenant $tenant, Client $client, string $fqdn): Domain
    {
        $parts = explode('.', strtolower($fqdn), 2);
        $tld = $parts[1] ?? 'test';

        return Domain::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_id' => $client->id,
            'domain' => strtolower($fqdn),
            'tld' => $tld,
            'status' => Domain::STATUS_ACTIVE,
            'registration_date' => now()->toDateString(),
            'expiry_date' => now()->addYear()->toDateString(),
            'auto_renew' => true,
            'dns_management' => false,
            'id_protection' => false,
            'renewal_price' => 1000,
            'currency' => 'USD',
            'notes' => 'Seed domain for rate limit tests.',
        ]);
    }

    private function assertThrottleResponse(TestResponse $response): void
    {
        $response->assertStatus(429)
            ->assertJsonStructure([
                'data',
                'meta',
                'errors' => [
                    ['message'],
                ],
            ])
            ->assertJsonPath('data', null)
            ->assertJsonPath('errors.0.message', 'Too many requests. Please try again later.');
    }
}
