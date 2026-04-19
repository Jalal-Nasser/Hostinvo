<?php

namespace Tests\Feature\Tenancy;

use App\Models\Role;
use App\Services\Auth\EmailVerificationService;
use App\Services\Licensing\LicenseService;
use App\Services\Notifications\NotificationDispatchService;
use App\Services\Tenancy\TenantManagementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use ReflectionMethod;
use Tests\TestCase;

class TenantManagementServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_owner_role_self_heals_when_missing(): void
    {
        $service = app(TenantManagementService::class);
        $method = new ReflectionMethod($service, 'tenantOwnerRole');
        $method->setAccessible(true);

        /** @var Role $role */
        $role = $method->invoke($service);

        $this->assertSame(Role::TENANT_OWNER, $role->name);
        $this->assertTrue(Role::query()->where('name', Role::TENANT_OWNER)->exists());
    }
}
