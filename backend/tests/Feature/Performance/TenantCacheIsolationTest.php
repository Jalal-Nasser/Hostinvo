<?php

namespace Tests\Feature\Performance;

use App\Models\ProductGroup;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Catalog\ProductGroupService;
use App\Services\Tenancy\TenantSettingService;
use App\Support\Tenancy\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\TestCase;

class TenantCacheIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_setting_cache_is_isolated_by_tenant_key_prefix(): void
    {
        Cache::flush();
        $service = app(TenantSettingService::class);

        $tenantA = $this->createTenant('alpha');
        $tenantB = $this->createTenant('beta');
        $settingKey = 'payments.stripe.enabled';

        $service->put($tenantA, $settingKey, true);
        $service->put($tenantB, $settingKey, false);

        $this->assertTrue($service->get($tenantA, $settingKey));
        $this->assertFalse($service->get($tenantB, $settingKey));
    }

    public function test_product_group_selection_cache_is_invalidated_after_mutation(): void
    {
        Cache::flush();
        $tenant = $this->createTenant('catalog');
        $actor = User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        app(CurrentTenant::class)->set($tenant);
        app()->instance('tenant', $tenant);

        /** @var ProductGroupService $service */
        $service = app(ProductGroupService::class);
        $this->assertCount(0, $service->allForSelection());

        $group = $service->create([
            'name' => 'Shared Hosting',
            'status' => ProductGroup::STATUS_ACTIVE,
            'visibility' => ProductGroup::VISIBILITY_PUBLIC,
            'display_order' => 1,
        ], $actor);

        $this->assertSame('Shared Hosting', $service->allForSelection()->first()?->name);

        ProductGroup::withoutGlobalScopes()
            ->whereKey($group->id)
            ->update(['name' => 'External Rename']);

        $this->assertSame('Shared Hosting', $service->allForSelection()->first()?->name);

        $service->update($group->fresh(), ['name' => 'Updated Name'], $actor);
        $this->assertSame('Updated Name', $service->allForSelection()->first()?->name);
    }

    private function createTenant(string $suffix): Tenant
    {
        return Tenant::query()->create([
            'name' => 'Tenant '.Str::upper($suffix),
            'slug' => 'tenant-'.$suffix,
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);
    }
}
