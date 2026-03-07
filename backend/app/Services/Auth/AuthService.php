<?php

namespace App\Services\Auth;

use App\Contracts\Repositories\Auth\UserRepositoryInterface;
use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
    ) {
    }

    public function login(array $payload, Request $request): User
    {
        $user = $this->users->findByEmail($payload['email']);

        $this->ensureLoginAllowed($user);

        if (! Auth::attempt([
            'email' => $payload['email'],
            'password' => $payload['password'],
            'is_active' => true,
        ], (bool) ($payload['remember'] ?? false))) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        $request->session()->regenerate();

        $user = $request->user() instanceof User
            ? $request->user()
            : $this->users->findByEmail($payload['email']);

        $user->forceFill([
            'last_login_at' => now(),
        ]);

        $this->users->save($user);

        return $this->currentUser($user);
    }

    public function logout(Request $request): void
    {
        $request->user()?->currentAccessToken()?->delete();

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }

    public function currentUser(User $user): User
    {
        return $user->loadMissing(['tenant', 'roles.permissions']);
    }

    public function sendPasswordResetLink(string $email): string
    {
        $status = Password::sendResetLink(['email' => $email]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages([
                'email' => [trans($status)],
            ]);
        }

        return trans($status);
    }

    public function resetPassword(array $payload): string
    {
        $status = Password::reset(
            $payload,
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [trans($status)],
            ]);
        }

        return trans($status);
    }

    private function ensureLoginAllowed(?User $user): void
    {
        if (! $user) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => [__('auth.inactive')],
            ]);
        }

        if ($user->tenant_id && optional($user->tenant)->status !== 'active' && ! $user->hasRole(Role::SUPER_ADMIN)) {
            throw ValidationException::withMessages([
                'email' => [__('auth.tenant_inactive')],
            ]);
        }
    }
}
