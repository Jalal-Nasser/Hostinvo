<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use App\Models\User;
use App\Models\UserMfaMethod;
use App\Models\UserRecoveryCode;
use App\Services\Auth\PasskeyService;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class SuperAdminMfaAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_password_login_enters_mfa_challenge_flow(): void
    {
        $user = $this->createSuperAdmin();
        $this->addConfirmedTotp($user, 'JBSWY3DPEHPK3PXP');
        $csrf = 'test-csrf-token';

        $response = $this
            ->withHeaders($this->statefulHeaders($csrf))
            ->withSession(['_token' => $csrf])
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'password',
                'remember' => false,
            ]);

        $response
            ->assertAccepted()
            ->assertJsonPath('data.status', 'mfa_required');
    }

    public function test_super_admin_can_complete_totp_challenge_after_password_step(): void
    {
        $user = $this->createSuperAdmin();
        $secret = 'JBSWY3DPEHPK3PXP';
        $this->addConfirmedTotp($user, $secret);
        $csrf = 'test-csrf-token';

        $response = $this
            ->withHeaders($this->statefulHeaders($csrf))
            ->withSession([
                '_token' => $csrf,
                'auth.mfa.pending' => [
                    'user_id' => $user->getKey(),
                    'remember' => false,
                    'started_at' => now()->toIso8601String(),
                ],
            ])
            ->postJson('/api/v1/auth/mfa/challenge', [
                'code' => $this->currentTotpCode($secret),
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.status', 'authenticated')
            ->assertJsonPath('data.user.id', $user->getKey());
    }

    public function test_super_admin_can_complete_recovery_code_challenge(): void
    {
        $user = $this->createSuperAdmin();
        $this->addConfirmedTotp($user, 'JBSWY3DPEHPK3PXP');
        $csrf = 'test-csrf-token';
        UserRecoveryCode::query()->create([
            'user_id' => $user->getKey(),
            'code_hash' => Hash::make('ABCD-EFGH'),
            'created_at' => now(),
        ]);

        $response = $this
            ->withHeaders($this->statefulHeaders($csrf))
            ->withSession([
                '_token' => $csrf,
                'auth.mfa.pending' => [
                    'user_id' => $user->getKey(),
                    'remember' => false,
                    'started_at' => now()->toIso8601String(),
                ],
            ])
            ->postJson('/api/v1/auth/mfa/challenge', [
                'recovery_code' => 'ABCD-EFGH',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.status', 'authenticated')
            ->assertJsonPath('data.user.id', $user->getKey());

        $this->assertNotNull(
            UserRecoveryCode::query()->where('user_id', $user->getKey())->first()?->used_at
        );
    }

    public function test_authenticated_mfa_status_counts_passkey_as_enrolled(): void
    {
        $user = $this->createSuperAdmin();

        UserMfaMethod::query()->create([
            'user_id' => $user->getKey(),
            'type' => UserMfaMethod::TYPE_WEBAUTHN,
            'label' => 'Office MacBook',
            'metadata' => ['rp_id' => 'localhost'],
            'confirmed_at' => now(),
            'last_used_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/auth/mfa/status');

        $response
            ->assertOk()
            ->assertJsonPath('data.state', 'authenticated')
            ->assertJsonPath('data.mfa.enrolled', true);
    }

    public function test_passkey_authentication_endpoint_returns_authenticated_state(): void
    {
        $user = $this->createSuperAdmin();
        $csrf = 'test-csrf-token';

        $this->mock(PasskeyService::class, function (Mockery\MockInterface $mock) use ($user): void {
            $mock->shouldReceive('authenticate')
                ->once()
                ->andReturn($user->loadMissing(['tenant', 'roles.permissions']));
        });

        $response = $this
            ->withHeaders($this->statefulHeaders($csrf))
            ->withSession([
                '_token' => $csrf,
                'auth.mfa.pending' => [
                    'user_id' => $user->getKey(),
                    'remember' => false,
                    'started_at' => now()->toIso8601String(),
                ],
            ])
            ->postJson('/api/v1/auth/passkeys/authenticate/verify', [
                'credential' => [
                    'id' => 'credential-id',
                    'rawId' => 'credential-id',
                    'response' => [
                        'clientDataJSON' => 'Y2xpZW50',
                        'authenticatorData' => 'YXV0aA',
                        'signature' => 'c2ln',
                        'userHandle' => null,
                    ],
                ],
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.status', 'authenticated')
            ->assertJsonPath('data.user.id', $user->getKey());
    }

    public function test_logout_works_without_server_error(): void
    {
        $user = $this->createSuperAdmin();
        $csrf = 'test-csrf-token';
        Sanctum::actingAs($user);

        $response = $this
            ->withHeaders($this->statefulHeaders($csrf))
            ->withSession(['_token' => $csrf])
            ->postJson('/api/v1/auth/logout');

        $response->assertOk();
    }

    private function createSuperAdmin(): User
    {
        $this->seed(RolePermissionSeeder::class);

        $user = User::factory()->create([
            'tenant_id' => null,
            'email' => 'admin@gmail.com',
            'password' => 'password',
            'email_verified_at' => now(),
            'email_verification_required' => false,
            'is_active' => true,
        ]);

        $user->assignRole(Role::SUPER_ADMIN);
        $user->load('roles');

        return $user;
    }

    private function addConfirmedTotp(User $user, string $secret): void
    {
        UserMfaMethod::query()->create([
            'user_id' => $user->getKey(),
            'type' => UserMfaMethod::TYPE_TOTP,
            'label' => 'Authenticator',
            'secret' => encrypt($secret),
            'metadata' => ['issuer' => 'Hostinvo'],
            'confirmed_at' => now(),
            'last_used_at' => now(),
        ]);
    }

    private function currentTotpCode(string $secret): string
    {
        $counter = (int) floor(time() / (int) config('security.mfa.time_step', 30));
        $binarySecret = $this->base32Decode($secret);
        $binaryCounter = pack('N*', 0) . pack('N*', $counter);
        $hash = hash_hmac('sha1', $binaryCounter, $binarySecret, true);
        $offset = ord(substr($hash, -1)) & 0x0F;
        $segment = substr($hash, $offset, 4);
        $value = unpack('N', $segment)[1] & 0x7fffffff;

        return str_pad((string) ($value % 1000000), 6, '0', STR_PAD_LEFT);
    }

    private function base32Decode(string $secret): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $cleaned = strtoupper(preg_replace('/[^A-Z2-7]/', '', $secret) ?? '');
        $buffer = 0;
        $bitsLeft = 0;
        $output = '';

        foreach (str_split($cleaned) as $character) {
            $position = strpos($alphabet, $character);

            if ($position === false) {
                continue;
            }

            $buffer = ($buffer << 5) | $position;
            $bitsLeft += 5;

            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $output .= chr(($buffer >> $bitsLeft) & 0xff);
            }
        }

        return $output;
    }

    private function statefulHeaders(string $csrf): array
    {
        return [
            'Origin' => 'http://localhost:3000',
            'Referer' => 'http://localhost:3000/en/auth/login',
            'Accept' => 'application/json',
            'X-Requested-With' => 'XMLHttpRequest',
            'X-CSRF-TOKEN' => $csrf,
        ];
    }
}
