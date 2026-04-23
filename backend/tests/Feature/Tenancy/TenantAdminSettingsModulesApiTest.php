<?php

namespace Tests\Feature\Tenancy;

use App\Models\License;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantAdminSettingsModulesApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_can_load_and_update_branding_portal_surface_and_payment_gateway_settings(): void
    {
        [$tenant, $user] = $this->createTenantAdminContext('settings-modules');

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/admin/settings/branding')
            ->assertOk()
            ->assertJsonPath('data.company_name', $tenant->name);

        $this->postJson('/api/v1/admin/settings/branding', [
            'company_name' => 'Updated Tenant Name',
            'portal_name' => 'Updated Portal',
            'portal_tagline' => 'Managed hosting for modern teams.',
            'default_currency' => 'EUR',
            'default_locale' => 'en',
            'timezone' => 'Europe/Berlin',
            'remove_logo' => false,
            'remove_favicon' => false,
        ])->assertOk()
            ->assertJsonPath('data.company_name', 'Updated Tenant Name')
            ->assertJsonPath('data.portal_name', 'Updated Portal');

        $surfaceResponse = $this->getJson('/api/v1/admin/settings/portal-surface')
            ->assertOk();

        $surfacePayload = $surfaceResponse->json('data');
        $surfacePayload['navigation'][0]['label_en'] = 'Catalog';
        $surfacePayload['content_sources']['announcements'] = false;

        $this->putJson('/api/v1/admin/settings/portal-surface', $surfacePayload)
            ->assertOk()
            ->assertJsonPath('data.navigation.0.label_en', 'Catalog')
            ->assertJsonPath('data.content_sources.announcements', false);

        $this->getJson('/api/v1/admin/settings/payments/gateways')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'stripe',
                    'paypal',
                    'manual',
                ],
            ]);

        $this->putJson('/api/v1/admin/settings/payments/gateways', [
            'stripe' => [
                'enabled' => true,
                'publishable_key' => 'pk_test_settings',
                'secret_key' => 'sk_test_settings',
                'webhook_secret' => 'whsec_settings',
            ],
            'paypal' => [
                'enabled' => true,
                'client_id' => 'paypal-client-settings',
                'client_secret' => 'paypal-secret-settings',
                'webhook_id' => 'paypal-webhook-settings',
                'mode' => 'sandbox',
            ],
            'manual' => [
                'enabled' => true,
                'instructions' => 'Send transfer confirmation to billing@tenant.test.',
            ],
        ])->assertOk()
            ->assertJsonPath('data.stripe.enabled', true)
            ->assertJsonPath('data.paypal.enabled', true)
            ->assertJsonPath('data.manual.instructions', 'Send transfer confirmation to billing@tenant.test.');

        $this->assertDatabaseHas('tenants', [
            'id' => $tenant->id,
            'name' => 'Updated Tenant Name',
            'default_currency' => 'EUR',
            'timezone' => 'Europe/Berlin',
        ]);

        $this->assertDatabaseHas('tenant_settings', [
            'tenant_id' => $tenant->id,
            'key' => 'branding.portal_name',
        ]);

        $this->assertDatabaseHas('tenant_settings', [
            'tenant_id' => $tenant->id,
            'key' => 'portal.surface.navigation',
        ]);

        $this->assertDatabaseHas('tenant_settings', [
            'tenant_id' => $tenant->id,
            'key' => 'payments.manual.instructions',
        ]);
    }

    public function test_tenant_admin_can_load_and_persist_content_management_resources(): void
    {
        [$tenant, $user] = $this->createTenantAdminContext('content-modules');

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/admin/announcements')->assertOk();
        $this->getJson('/api/v1/admin/knowledgebase-categories')->assertOk();
        $this->getJson('/api/v1/admin/knowledgebase-articles')->assertOk();
        $this->getJson('/api/v1/admin/network-incidents')->assertOk();
        $this->getJson('/api/v1/admin/portal-content-blocks')->assertOk();
        $this->getJson('/api/v1/admin/portal-footer-links')->assertOk();

        $announcementId = $this->postJson('/api/v1/admin/announcements', [
            'title_en' => 'Maintenance Notice',
            'body_en' => 'Infrastructure maintenance starts at 22:00 UTC.',
            'status' => 'published',
            'is_featured' => true,
            'sort_order' => 5,
        ])->assertCreated()
            ->json('data.id');

        $categoryId = $this->postJson('/api/v1/admin/knowledgebase-categories', [
            'name_en' => 'General',
            'description_en' => 'General customer questions.',
            'status' => 'active',
            'sort_order' => 1,
        ])->assertCreated()
            ->json('data.id');

        $articleId = $this->postJson('/api/v1/admin/knowledgebase-articles', [
            'category_id' => $categoryId,
            'title_en' => 'How to reset cPanel password',
            'body_en' => 'Use the client area service actions panel.',
            'status' => 'published',
            'sort_order' => 1,
        ])->assertCreated()
            ->json('data.id');

        $incidentId = $this->postJson('/api/v1/admin/network-incidents', [
            'title_en' => 'Node latency',
            'status' => 'open',
            'severity' => 'warning',
            'is_public' => true,
            'sort_order' => 1,
        ])->assertCreated()
            ->json('data.id');

        $blockId = $this->postJson('/api/v1/admin/portal-content-blocks', [
            'section' => 'website_security',
            'key' => 'security_tls',
            'title_en' => 'TLS Everywhere',
            'body_en' => 'All customer sites include managed TLS certificates.',
            'status' => 'published',
            'sort_order' => 1,
        ])->assertCreated()
            ->json('data.id');

        $footerLinkId = $this->postJson('/api/v1/admin/portal-footer-links', [
            'group_key' => 'legal',
            'label_en' => 'Privacy Policy',
            'href' => 'https://tenant.test/privacy',
            'is_visible' => true,
            'open_in_new_tab' => true,
            'sort_order' => 1,
        ])->assertCreated()
            ->json('data.id');

        $this->getJson('/api/v1/admin/announcements')
            ->assertOk()
            ->assertJsonFragment(['id' => $announcementId]);

        $this->getJson('/api/v1/admin/knowledgebase-categories')
            ->assertOk()
            ->assertJsonFragment(['id' => $categoryId]);

        $this->getJson('/api/v1/admin/knowledgebase-articles')
            ->assertOk()
            ->assertJsonFragment(['id' => $articleId]);

        $this->getJson('/api/v1/admin/network-incidents')
            ->assertOk()
            ->assertJsonFragment(['id' => $incidentId]);

        $this->getJson('/api/v1/admin/portal-content-blocks')
            ->assertOk()
            ->assertJsonFragment(['id' => $blockId]);

        $this->getJson('/api/v1/admin/portal-footer-links')
            ->assertOk()
            ->assertJsonFragment(['id' => $footerLinkId]);

        $this->assertDatabaseHas('announcements', [
            'id' => $announcementId,
            'tenant_id' => $tenant->id,
            'title_en' => 'Maintenance Notice',
        ]);

        $this->assertDatabaseHas('knowledge_base_categories', [
            'id' => $categoryId,
            'tenant_id' => $tenant->id,
            'name_en' => 'General',
        ]);

        $this->assertDatabaseHas('knowledge_base_articles', [
            'id' => $articleId,
            'tenant_id' => $tenant->id,
            'title_en' => 'How to reset cPanel password',
        ]);

        $this->assertDatabaseHas('network_incidents', [
            'id' => $incidentId,
            'tenant_id' => $tenant->id,
            'title_en' => 'Node latency',
        ]);

        $this->assertDatabaseHas('portal_content_blocks', [
            'id' => $blockId,
            'tenant_id' => $tenant->id,
            'key' => 'security_tls',
        ]);

        $this->assertDatabaseHas('portal_footer_links', [
            'id' => $footerLinkId,
            'tenant_id' => $tenant->id,
            'label_en' => 'Privacy Policy',
        ]);
    }

    /**
     * @return array{0: Tenant, 1: User}
     */
    private function createTenantAdminContext(string $slug): array
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => ucfirst($slug).' Tenant',
            'slug' => $slug,
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        License::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'license_key' => 'HOST-'.strtoupper(str_replace('-', '', $slug)).'-001',
            'owner_email' => "{$slug}@example.test",
            'type' => License::PLAN_PROFESSIONAL,
            'plan' => License::PLAN_PROFESSIONAL,
            'license_type' => License::PLAN_PROFESSIONAL,
            'status' => License::STATUS_ACTIVE,
            'domain' => 'localhost',
            'max_clients' => 500,
            'max_services' => 100,
            'activation_limit' => 2,
            'issued_at' => now(),
            'expires_at' => now()->addMonth(),
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => "{$slug}-admin@example.test",
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
