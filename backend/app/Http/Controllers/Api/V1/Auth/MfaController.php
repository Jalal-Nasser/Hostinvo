<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\MfaChallengeRequest;
use App\Http\Requests\Auth\MfaReauthRequest;
use App\Http\Requests\Auth\MfaSetupConfirmRequest;
use App\Http\Resources\Auth\AuthenticatedUserResource;
use App\Models\Role;
use App\Models\User;
use App\Services\Auth\MfaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MfaController extends Controller
{
    public function status(Request $request, MfaService $mfa): JsonResponse
    {
        if ($request->user() instanceof User) {
            $this->assertSuperAdmin($request->user());

            return $this->success([
                'state' => 'authenticated',
                'mfa' => $mfa->authenticatedStatus($request->user()),
            ]);
        }

        return $this->success([
            'state' => 'pending',
            'mfa' => $mfa->pendingStatus($request),
        ]);
    }

    public function setup(Request $request, MfaService $mfa): JsonResponse
    {
        if ($request->user() instanceof User) {
            $this->assertSuperAdmin($request->user());

            return $this->success([
                'state' => 'authenticated',
                'setup' => $mfa->startAuthenticatedSetup($request),
            ]);
        }

        return $this->success([
            'state' => 'pending',
            'setup' => [
                'secret' => $mfa->pendingStatus($request)['secret'],
                'otp_auth_url' => $mfa->pendingStatus($request)['otp_auth_url'],
            ],
        ]);
    }

    public function confirmSetup(
        MfaSetupConfirmRequest $request,
        MfaService $mfa,
    ): JsonResponse {
        if ($request->user() instanceof User) {
            $this->assertSuperAdmin($request->user());

            if (! filled($request->validated('current_password'))) {
                throw ValidationException::withMessages([
                    'current_password' => [__('auth.current_password_required')],
                ]);
            }
        }

        $result = $mfa->confirmSetup(
            $request,
            (string) $request->validated('code'),
            $request->validated('current_password'),
        );

        return $this->success([
            'status' => $request->user() instanceof User ? 'mfa_updated' : 'authenticated',
            'user' => isset($result['user'])
                ? (new AuthenticatedUserResource($result['user']))->resolve($request)
                : null,
            'recovery_codes' => $result['recovery_codes'],
        ])->cookie(cookie()->forget($mfa->pendingCookieName()));
    }

    public function challenge(
        MfaChallengeRequest $request,
        MfaService $mfa,
    ): JsonResponse {
        $user = $mfa->verifyChallenge(
            $request,
            $request->validated('code'),
            $request->validated('recovery_code'),
        );

        return $this->success([
            'status' => 'authenticated',
            'user' => (new AuthenticatedUserResource($user))->resolve($request),
        ])->cookie(cookie()->forget($mfa->pendingCookieName()));
    }

    public function regenerateRecoveryCodes(
        MfaReauthRequest $request,
        MfaService $mfa,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $this->assertSuperAdmin($user);

        return $this->success([
            'recovery_codes' => $mfa->regenerateRecoveryCodes(
                $user,
                (string) $request->validated('current_password'),
            ),
        ]);
    }

    public function disable(
        MfaReauthRequest $request,
        MfaService $mfa,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();
        $this->assertSuperAdmin($user);

        $mfa->disable($user, (string) $request->validated('current_password'));

        return $this->message(__('auth.mfa_disabled'));
    }

    private function assertSuperAdmin(User $user): void
    {
        if (! $user->hasRole(Role::SUPER_ADMIN)) {
            throw ValidationException::withMessages([
                'mfa' => [__('auth.mfa_not_supported')],
            ]);
        }
    }
}
