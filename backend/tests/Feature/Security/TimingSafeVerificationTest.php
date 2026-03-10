<?php

namespace Tests\Feature\Security;

use App\Contracts\Repositories\Auth\UserRepositoryInterface;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Auth\AuthService;
use App\Support\Auth\PasswordResetTenantContext;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Mockery\MockInterface;
use Tests\TestCase;

class TimingSafeVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_returns_generic_success_without_tenant_context(): void
    {
        Notification::fake();

        $tenant = Tenant::query()->create([
            'name' => 'Timing Tenant',
            'slug' => 'timing-tenant',
            'primary_domain' => 'timing.example.test',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'timing@example.test',
        ]);

        $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'timing@example.test',
        ])->assertOk()
            ->assertJsonPath('data.message', trans('passwords.sent'));

        Notification::assertNothingSent();

        $this->assertDatabaseMissing('password_reset_tokens', [
            'tenant_id' => $tenant->id,
            'email' => $user->email,
        ]);
    }

    public function test_login_with_unknown_user_still_uses_hash_check(): void
    {
        $this->mock(UserRepositoryInterface::class, function (MockInterface $mock): void {
            $mock->shouldReceive('findByEmail')->once()->andReturn(null);
        });

        Hash::shouldReceive('check')->once()->andReturnFalse();

        $service = app(AuthService::class);
        $request = Request::create('/api/v1/auth/login', 'POST', [
            'email' => 'missing@example.test',
            'password' => 'secret-value',
        ]);

        try {
            $service->login([
                'email' => 'missing@example.test',
                'password' => 'secret-value',
            ], $request);

            $this->fail('Expected login to fail for an unknown user.');
        } catch (ValidationException $exception) {
            $this->assertSame(__('auth.failed'), $exception->errors()['email'][0] ?? null);
        }

    }

    public function test_reset_password_with_missing_record_still_uses_hash_check_and_returns_token_error(): void
    {
        $tenant = Tenant::query()->create([
            'name' => 'Reset Tenant',
            'slug' => 'reset-tenant',
            'primary_domain' => 'reset.example.test',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'reset@example.test',
        ]);

        $token = 'missing-reset-token';
        $context = app(PasswordResetTenantContext::class)->buildSignedUrlContext($user, $token);

        Hash::shouldReceive('check')->once()->andReturnFalse();

        $service = app(AuthService::class);
        $request = Request::create('/api/v1/auth/reset-password', 'POST', [
            'token' => $token,
            'email' => $user->email,
            'tenant_id' => $context['tenant_id'],
            'tenant_signature' => $context['tenant_signature'],
            'password' => 'NewStrongPassword123!',
            'password_confirmation' => 'NewStrongPassword123!',
        ]);

        try {
            $service->resetPassword([
                'token' => $token,
                'email' => $user->email,
                'tenant_id' => $context['tenant_id'],
                'tenant_signature' => $context['tenant_signature'],
                'password' => 'NewStrongPassword123!',
                'password_confirmation' => 'NewStrongPassword123!',
            ], $request);

            $this->fail('Expected password reset to fail without a stored token record.');
        } catch (ValidationException $exception) {
            $this->assertSame(trans('passwords.token'), $exception->errors()['email'][0] ?? null);
        }

    }

    public function test_forgot_password_still_notifies_for_valid_tenant_context(): void
    {
        Notification::fake();

        $tenant = Tenant::query()->create([
            'name' => 'Valid Tenant',
            'slug' => 'valid-tenant',
            'primary_domain' => 'valid.example.test',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'valid@example.test',
        ]);

        $this->postJson('/api/v1/auth/forgot-password', [
            'email' => $user->email,
        ], [
            'X-Tenant-Host' => 'valid.example.test',
        ])->assertOk()
            ->assertJsonPath('data.message', trans('passwords.sent'));

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_forgot_password_for_inactive_user_returns_same_generic_success(): void
    {
        Notification::fake();

        $tenant = Tenant::query()->create([
            'name' => 'Inactive Tenant',
            'slug' => 'inactive-tenant',
            'primary_domain' => 'inactive.example.test',
            'default_locale' => 'en',
            'default_currency' => 'USD',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'inactive@example.test',
            'is_active' => false,
        ]);

        $this->postJson('/api/v1/auth/forgot-password', [
            'email' => $user->email,
        ], [
            'X-Tenant-Host' => 'inactive.example.test',
        ])->assertOk()
            ->assertJsonPath('data.message', trans('passwords.sent'));

        Notification::assertNothingSent();

        $this->assertDatabaseMissing('password_reset_tokens', [
            'tenant_id' => $tenant->id,
            'email' => $user->email,
        ]);
    }
}
