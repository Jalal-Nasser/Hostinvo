<?php

namespace Tests\Feature\Security;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\NotificationTemplate;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductPricing;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StoredXssProtectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_content_is_sanitized_before_storage_and_api_response(): void
    {
        $this->seed(RolePermissionSeeder::class);

        [$tenant, $user] = $this->createTenantAdminContext('xss-support-tenant');
        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Support Client',
            'email' => 'support-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $contact = $client->contacts()->create([
            'tenant_id' => $tenant->id,
            'first_name' => 'Amina',
            'last_name' => 'Khan',
            'email' => 'amina@example.test',
            'is_primary' => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/admin/tickets', [
            'client_id' => $client->id,
            'client_contact_id' => $contact->id,
            'subject' => '<img src=x onerror=alert(1)>Portal issue',
            'priority' => 'high',
            'message' => '<script>alert(1)</script>DNS outage <b>reported</b>.',
        ]);

        $ticketId = $response->json('data.id');

        $response->assertCreated()
            ->assertJsonPath('data.subject', 'Portal issue')
            ->assertJsonPath('data.replies.0.message', 'DNS outage reported.');

        $this->assertDatabaseHas('tickets', [
            'id' => $ticketId,
            'subject' => 'Portal issue',
        ]);

        $this->assertDatabaseHas('ticket_replies', [
            'ticket_id' => $ticketId,
            'message' => 'DNS outage reported.',
        ]);
    }

    public function test_ticket_reply_xss_is_sanitized_via_reply_endpoint(): void
    {
        $this->seed(RolePermissionSeeder::class);

        [$tenant, $user] = $this->createTenantAdminContext('xss-ticket-reply-tenant');
        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Reply Client',
            'email' => 'reply-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $contact = $client->contacts()->create([
            'tenant_id' => $tenant->id,
            'first_name' => 'Noura',
            'last_name' => 'Salem',
            'email' => 'noura@example.test',
            'is_primary' => true,
        ]);

        Sanctum::actingAs($user);

        $ticketResponse = $this->postJson('/api/v1/admin/tickets', [
            'client_id' => $client->id,
            'client_contact_id' => $contact->id,
            'subject' => 'Reply sanitization check',
            'priority' => 'medium',
            'message' => 'Initial ticket message.',
        ])->assertCreated();

        $ticketId = $ticketResponse->json('data.id');

        $response = $this->postJson("/api/v1/admin/tickets/{$ticketId}/replies", [
            'message' => "<script>alert('xss')</script><img src=x onerror=alert(1)>Reply content",
        ]);

        $response->assertOk()
            ->assertJsonPath('data.replies.1.message', 'Reply content');

        $responseBody = $response->getContent();

        $this->assertIsString($responseBody);
        $this->assertStringNotContainsString('<script', $responseBody);
        $this->assertStringNotContainsString('onerror=', $responseBody);

        $this->assertDatabaseHas('ticket_replies', [
            'ticket_id' => $ticketId,
            'message' => 'Reply content',
        ]);
    }

    public function test_client_notes_are_sanitized_before_storage_and_api_response(): void
    {
        $this->seed(RolePermissionSeeder::class);

        [, $user] = $this->createTenantAdminContext('xss-client-tenant');

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/admin/clients', [
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Example Corp',
            'email' => 'billing@example.test',
            'phone' => '+966500000000',
            'country' => 'sa',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'ar',
            'currency' => 'sar',
            'notes' => '<script>alert(1)</script>Trusted client.',
        ]);

        $clientId = $response->json('data.id');

        $response->assertCreated()
            ->assertJsonPath('data.notes', 'Trusted client.');

        $this->assertDatabaseHas('clients', [
            'id' => $clientId,
            'notes' => 'Trusted client.',
        ]);
    }

    public function test_order_notes_are_sanitized_in_review_and_storage(): void
    {
        $this->seed(RolePermissionSeeder::class);

        [$tenant, $user] = $this->createTenantAdminContext('xss-orders-tenant');
        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Orders Client',
            'email' => 'orders-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        $product = Product::query()->create([
            'tenant_id' => $tenant->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Starter Hosting',
            'slug' => 'starter-hosting',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_PUBLIC,
            'display_order' => 0,
            'is_featured' => false,
        ]);

        ProductPricing::query()->create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
            'currency' => 'USD',
            'price' => '5.99',
            'setup_fee' => '1.00',
            'is_enabled' => true,
        ]);

        Sanctum::actingAs($user);

        $payload = [
            'client_id' => $client->id,
            'currency' => 'USD',
            'notes' => '<img src=x onerror=alert(1)>Initial order.',
            'items' => [
                [
                    'product_id' => $product->id,
                    'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
                    'quantity' => 1,
                ],
            ],
        ];

        $this->postJson('/api/v1/admin/orders/review', $payload)
            ->assertOk()
            ->assertJsonPath('data.notes', 'Initial order.');

        $response = $this->postJson('/api/v1/admin/orders', $payload);
        $orderId = $response->json('data.id');

        $response->assertCreated()
            ->assertJsonPath('data.notes', 'Initial order.');

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'notes' => 'Initial order.',
        ]);
    }

    public function test_invoice_notes_are_sanitized_before_storage_and_api_response(): void
    {
        $this->seed(RolePermissionSeeder::class);

        [$tenant, $user] = $this->createTenantAdminContext('xss-billing-tenant');
        $client = Client::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'client_type' => Client::TYPE_COMPANY,
            'company_name' => 'Billing Client',
            'email' => 'billing-client@example.test',
            'country' => 'US',
            'status' => Client::STATUS_ACTIVE,
            'preferred_locale' => 'en',
            'currency' => 'USD',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/admin/invoices', [
            'client_id' => $client->id,
            'issue_date' => '2026-03-08',
            'due_date' => '2026-03-15',
            'notes' => '<script>alert(1)</script>Invoice note.',
            'items' => [
                [
                    'item_type' => 'manual',
                    'description' => 'Manual invoice item',
                    'quantity' => 1,
                    'unit_price_minor' => 1500,
                ],
            ],
        ]);

        $invoiceId = $response->json('data.id');

        $response->assertCreated()
            ->assertJsonPath('data.notes', 'Invoice note.');

        $this->assertDatabaseHas('invoices', [
            'id' => $invoiceId,
            'notes' => 'Invoice note.',
        ]);
    }

    public function test_notification_templates_strip_unsafe_html_but_keep_safe_markup(): void
    {
        $tenant = Tenant::query()->create([
            'name' => 'Templates Tenant',
            'slug' => 'templates-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $template = NotificationTemplate::query()->create([
            'tenant_id' => $tenant->id,
            'event' => 'invoice_created',
            'locale' => 'en',
            'subject' => '<script>alert(1)</script>Invoice ready',
            'body_html' => '<script>alert(1)</script><p>Hello <strong>Portal</strong></p><a href="javascript:alert(1)" onclick="alert(1)">Bad</a><a href="https://example.test/pay" onclick="alert(1)">Pay now</a>',
            'body_text' => '<script>alert(1)</script>Please pay your invoice.',
            'is_enabled' => true,
        ]);

        $this->assertSame('Invoice ready', $template->subject);
        $this->assertSame('Please pay your invoice.', $template->body_text);
        $this->assertStringNotContainsString('<script', $template->body_html);
        $this->assertStringNotContainsString('onclick=', $template->body_html);
        $this->assertStringNotContainsString('javascript:', $template->body_html);
        $this->assertStringContainsString('<strong>Portal</strong>', $template->body_html);
        $this->assertStringContainsString('https://example.test/pay', $template->body_html);
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
}
