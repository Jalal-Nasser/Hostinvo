<?php

namespace Tests\Feature\Catalog;

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
            'slug' => 'starter-hosting',
            'sku' => 'HOST-STARTER',
            'summary' => 'For first websites.',
            'description' => 'Starter package for low-traffic websites.',
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
            'slug' => 'starter-hosting-plus',
            'sku' => 'HOST-STARTER-PLUS',
            'summary' => 'Upgraded starter plan.',
            'description' => 'Updated product description.',
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
            ->assertJsonPath('data.visibility', 'private');

        $this->getJson('/api/v1/admin/products')
            ->assertOk()
            ->assertJsonPath('data.0.id', $productId);

        $this->getJson('/api/v1/admin/product-groups')
            ->assertOk()
            ->assertJsonPath('data.0.id', $groupId);
    }
}
