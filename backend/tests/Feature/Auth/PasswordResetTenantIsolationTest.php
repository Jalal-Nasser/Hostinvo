<?php

namespace Tests\Feature\Auth;

use App\Models\Tenant;
use App\Models\User;
use App\Support\Auth\PasswordResetTenantContext;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_reset_tokens_are_scoped_by_tenant_and_reset_uses_signed_tenant_context(): void
    {
        Notification::fake();

        $tenantA = Tenant::query()->create([
            'name' => 'Tenant A',
            'slug' => 'tenant-a',
            'primary_domain' => 'tenant-a.example.test',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $tenantB = Tenant::query()->create([
            'name' => 'Tenant B',
            'slug' => 'tenant-b',
            'primary_domain' => 'tenant-b.example.test',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $userA = User::factory()->create([
            'tenant_id' => $tenantA->id,
            'email' => 'shared@example.test',
        ]);

        User::factory()->create([
            'tenant_id' => $tenantB->id,
            'email' => 'shared@example.test',
        ]);

        $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'shared@example.test',
        ], [
            'X-Tenant-Host' => 'tenant-a.example.test',
        ])->assertOk();

        $this->assertDatabaseHas('password_reset_tokens', [
            'tenant_id' => $tenantA->id,
            'email' => 'shared@example.test',
        ]);

        $this->assertDatabaseMissing('password_reset_tokens', [
            'tenant_id' => $tenantB->id,
            'email' => 'shared@example.test',
        ]);

        $token = null;

        Notification::assertSentTo($userA, ResetPassword::class, function (ResetPassword $notification) use (&$token): bool {
            $token = $notification->token;

            return true;
        });

        $context = app(PasswordResetTenantContext::class)->buildSignedUrlContext($userA, $token);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'shared@example.test',
            'tenant_id' => $context['tenant_id'],
            'tenant_signature' => $context['tenant_signature'],
            'password' => 'NewStrongPassword123!',
            'password_confirmation' => 'NewStrongPassword123!',
        ])->assertOk();

        $this->assertTrue(Hash::check('NewStrongPassword123!', $userA->fresh()->password));
        $this->assertDatabaseMissing('password_reset_tokens', [
            'tenant_id' => $tenantA->id,
            'email' => 'shared@example.test',
        ]);
    }
}
