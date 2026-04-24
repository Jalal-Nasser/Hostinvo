<?php

namespace Tests\Feature\Catalog;

use App\Models\License;
use App\Models\Product;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductCatalogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_can_manage_product_groups_products_and_pricing(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Catalog Tenant',
            'slug' => 'catalog-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        License::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'license_key' => 'HOST-CATALOG-001',
            'owner_email' => 'owner@catalog.test',
            'type' => License::PLAN_PROFESSIONAL,
            'plan' => License::PLAN_PROFESSIONAL,
            'license_type' => License::PLAN_PROFESSIONAL,
            'status' => License::STATUS_ACTIVE,
            'max_clients' => 500,
            'max_services' => 500,
            'activation_limit' => 2,
            'issued_at' => now(),
            'expires_at' => now()->addYear(),
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'catalog-admin@example.test',
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

        Sanctum::actingAs($user);

        $groupResponse = $this->postJson('/api/v1/admin/product-groups', [
            'name' => 'Shared Hosting',
            'slug' => 'shared-hosting',
            'description' => 'Entry-level hosting plans.',
            'status' => 'active',
            'visibility' => 'public',
            'display_order' => 1,
        ]);

        $groupId = $groupResponse->json('data.id');

        $groupResponse
            ->assertCreated()
            ->assertJsonPath('data.name', 'Shared Hosting');

        $productResponse = $this->postJson('/api/v1/admin/products', [
            'product_group_id' => $groupId,
            'type' => 'hosting',
            'name' => 'Starter Hosting',
            'tagline' => 'For growing sites',
            'slug' => 'starter-hosting',
            'sku' => 'HOST-STARTER',
            'summary' => 'For first websites.',
            'description' => 'Starter package for low-traffic websites.',
            'color' => '#2563eb',
            'welcome_email' => 'Hosting Account Welcome Email',
            'require_domain' => true,
            'stock_control' => true,
            'stock_quantity' => 10,
            'apply_tax' => true,
            'retired' => false,
            'payment_type' => Product::PAYMENT_TYPE_RECURRING,
            'allow_multiple_quantities' => Product::MULTIPLE_QUANTITIES_NO,
            'recurring_cycles_limit' => 0,
            'auto_terminate_days' => 0,
            'termination_email' => 'None',
            'prorata_billing' => true,
            'prorata_date' => 1,
            'charge_next_month' => 20,
            'status' => 'active',
            'visibility' => 'public',
            'display_order' => 10,
            'is_featured' => true,
            'configurable_options' => [
                [
                    'name' => 'Storage',
                    'code' => 'storage',
                    'option_type' => 'select',
                    'status' => 'active',
                    'is_required' => true,
                    'display_order' => 1,
                    'choices' => [
                        [
                            'label' => '10 GB',
                            'value' => '10gb',
                            'is_default' => true,
                            'display_order' => 1,
                        ],
                        [
                            'label' => '25 GB',
                            'value' => '25gb',
                            'is_default' => false,
                            'display_order' => 2,
                        ],
                    ],
                ],
            ],
        ]);

        $productId = $productResponse->json('data.id');

        $productResponse
            ->assertCreated()
            ->assertJsonPath('data.group.id', $groupId)
            ->assertJsonPath('data.tagline', 'For growing sites')
            ->assertJsonPath('data.require_domain', true)
            ->assertJsonPath('data.configurable_options.0.name', 'Storage');

        $this->putJson("/api/v1/admin/products/{$productId}/pricing", [
            'pricing' => [
                [
                    'billing_cycle' => 'monthly',
                    'currency' => 'usd',
                    'price' => 5.99,
                    'setup_fee' => 0,
                    'is_enabled' => true,
                ],
                [
                    'billing_cycle' => 'annually',
                    'currency' => 'usd',
                    'price' => 59.99,
                    'setup_fee' => 0,
                    'is_enabled' => true,
                ],
            ],
        ])
            ->assertOk()
            ->assertJsonFragment([
                'billing_cycle' => 'monthly',
            ]);

        $this->putJson("/api/v1/admin/products/{$productId}", [
            'product_group_id' => $groupId,
            'type' => 'hosting',
            'name' => 'Starter Hosting Plus',
            'tagline' => 'For bigger websites',
            'slug' => 'starter-hosting-plus',
            'sku' => 'HOST-STARTER-PLUS',
            'summary' => 'Upgraded starter plan.',
            'description' => 'Updated product description.',
            'color' => '#16a34a',
            'welcome_email' => 'Updated Welcome Email',
            'require_domain' => false,
            'stock_control' => false,
            'stock_quantity' => null,
            'apply_tax' => false,
            'retired' => true,
            'payment_type' => Product::PAYMENT_TYPE_ONE_TIME,
            'allow_multiple_quantities' => Product::MULTIPLE_QUANTITIES_MULTIPLE_SERVICES,
            'recurring_cycles_limit' => 2,
            'auto_terminate_days' => 30,
            'termination_email' => 'Termination Notice',
            'prorata_billing' => false,
            'prorata_date' => null,
            'charge_next_month' => null,
            'status' => 'inactive',
            'visibility' => 'private',
            'display_order' => 15,
            'is_featured' => false,
            'configurable_options' => [
                [
                    'id' => $productResponse->json('data.configurable_options.0.id'),
                    'name' => 'Storage',
                    'code' => 'storage',
                    'option_type' => 'radio',
                    'status' => 'active',
                    'is_required' => true,
                    'display_order' => 1,
                    'choices' => [
                        [
                            'id' => $productResponse->json('data.configurable_options.0.choices.0.id'),
                            'label' => '20 GB',
                            'value' => '20gb',
                            'is_default' => true,
                            'display_order' => 1,
                        ],
                    ],
                ],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Starter Hosting Plus')
            ->assertJsonPath('data.status', 'inactive')
            ->assertJsonPath('data.visibility', 'private')
            ->assertJsonPath('data.payment_type', Product::PAYMENT_TYPE_ONE_TIME)
            ->assertJsonPath('data.retired', true);

        $this->getJson('/api/v1/admin/products')
            ->assertOk()
            ->assertJsonPath('data.0.id', $productId);

        $this->getJson('/api/v1/admin/product-groups')
            ->assertOk()
            ->assertJsonPath('data.0.id', $groupId);
    }

    public function test_tenant_admin_can_manage_product_addons(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'Addon Tenant',
            'slug' => 'addon-tenant',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        License::query()->forceCreate([
            'tenant_id' => $tenant->id,
            'license_key' => 'HOST-ADDON-001',
            'owner_email' => 'owner@addon.test',
            'type' => License::PLAN_PROFESSIONAL,
            'plan' => License::PLAN_PROFESSIONAL,
            'license_type' => License::PLAN_PROFESSIONAL,
            'status' => License::STATUS_ACTIVE,
            'max_clients' => 500,
            'max_services' => 500,
            'activation_limit' => 2,
            'issued_at' => now(),
            'expires_at' => now()->addYear(),
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'addon-admin@example.test',
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

        $product = Product::query()->create([
            'tenant_id' => $tenant->id,
            'type' => Product::TYPE_HOSTING,
            'name' => 'Main Hosting Plan',
            'slug' => 'main-hosting-plan',
            'status' => Product::STATUS_ACTIVE,
            'visibility' => Product::VISIBILITY_PUBLIC,
            'display_order' => 0,
            'is_featured' => false,
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/admin/product-addons', [
            'name' => 'Daily Backup',
            'slug' => 'daily-backup',
            'description' => 'Nightly offsite backups.',
            'status' => 'active',
            'visibility' => 'visible',
            'apply_tax' => true,
            'auto_activate' => true,
            'welcome_email' => 'Addon Welcome',
            'product_ids' => [$product->id],
            'pricing' => [
                [
                    'billing_cycle' => 'monthly',
                    'currency' => 'usd',
                    'price' => 3.00,
                    'setup_fee' => 0,
                    'is_enabled' => true,
                ],
            ],
        ]);

        $addonId = $response->json('data.id');

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Daily Backup')
            ->assertJsonPath('data.products.0.id', $product->id);

        $this->putJson("/api/v1/admin/product-addons/{$addonId}", [
            'name' => 'Daily Backup Plus',
            'slug' => 'daily-backup-plus',
            'description' => 'Nightly offsite backups with restore support.',
            'status' => 'hidden',
            'visibility' => 'hidden',
            'apply_tax' => false,
            'auto_activate' => false,
            'welcome_email' => 'Updated Addon Welcome',
            'product_ids' => [$product->id],
            'pricing' => [
                [
                    'billing_cycle' => 'monthly',
                    'currency' => 'usd',
                    'price' => 5.00,
                    'setup_fee' => 1.00,
                    'is_enabled' => true,
                ],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Daily Backup Plus')
            ->assertJsonPath('data.status', 'hidden')
            ->assertJsonPath('data.visibility', 'hidden');

        $this->getJson('/api/v1/admin/product-addons')
            ->assertOk()
            ->assertJsonPath('data.0.id', $addonId);
    }
}
