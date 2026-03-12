<?php

namespace Database\Seeders\Beta;

use App\Models\Product;
use App\Models\ProductGroup;
use App\Models\ProductPricing;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class BetaCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::query()
            ->where('slug', 'like', 'beta-%')
            ->get();

        foreach ($tenants as $tenant) {
            $group = ProductGroup::query()->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'slug' => 'shared-hosting',
                ],
                [
                    'name' => 'Shared Hosting',
                    'description' => 'Beta hosting catalog group.',
                    'status' => ProductGroup::STATUS_ACTIVE,
                    'visibility' => ProductGroup::VISIBILITY_PUBLIC,
                    'display_order' => 1,
                    'sort_order' => 1,
                ],
            );

            $products = [
                [
                    'name' => 'Starter Hosting',
                    'slug' => 'starter-hosting',
                    'summary' => 'Starter shared hosting plan for beta validation.',
                    'monthly' => '9.99',
                    'annually' => '99.00',
                ],
                [
                    'name' => 'Business Hosting',
                    'slug' => 'business-hosting',
                    'summary' => 'Business shared hosting plan for beta validation.',
                    'monthly' => '19.99',
                    'annually' => '199.00',
                ],
            ];

            foreach ($products as $definition) {
                $product = Product::query()->updateOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'slug' => $definition['slug'],
                    ],
                    [
                        'product_group_id' => $group->id,
                        'type' => Product::TYPE_HOSTING,
                        'name' => $definition['name'],
                        'sku' => strtoupper(sprintf('%s-%s', $tenant->slug, $definition['slug'])),
                        'summary' => $definition['summary'],
                        'description' => 'Seeded beta fixture product.',
                        'status' => Product::STATUS_ACTIVE,
                        'visibility' => Product::VISIBILITY_PUBLIC,
                        'display_order' => 1,
                        'is_featured' => false,
                    ],
                );

                ProductPricing::query()->updateOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'product_id' => $product->id,
                        'billing_cycle' => ProductPricing::CYCLE_MONTHLY,
                    ],
                    [
                        'currency' => 'USD',
                        'price' => $definition['monthly'],
                        'setup_fee' => '0.00',
                        'is_enabled' => true,
                    ],
                );

                ProductPricing::query()->updateOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'product_id' => $product->id,
                        'billing_cycle' => ProductPricing::CYCLE_ANNUALLY,
                    ],
                    [
                        'currency' => 'USD',
                        'price' => $definition['annually'],
                        'setup_fee' => '0.00',
                        'is_enabled' => true,
                    ],
                );
            }
        }
    }
}

