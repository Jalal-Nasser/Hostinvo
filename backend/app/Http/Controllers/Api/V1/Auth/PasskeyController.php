<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\PasskeyAuthenticateRequest;
use App\Http\Requests\Auth\PasskeyOptionsRequest;
use App\Http\Requests\Auth\PasskeyRegisterRequest;
use App\Http\Requests\Auth\PasskeyRenameRequest;
use App\Http\Requests\Auth\MfaReauthRequest;
use App\Http\Resources\Auth\AuthenticatedUserResource;
use App\Models\User;
use App\Models\UserWebauthnCredential;
use App\Services\Auth\MfaService;
use App\Services\Auth\PasskeyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PasskeyController extends Controller
{
    public function index(Request $request, PasskeyService $passkeys): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return $this->success([
            'items' => $passkeys->listCredentials($user),
        ]);
    }

    public function registrationOptions(Request $request, PasskeyService $passkeys): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return $this->success(
            $passkeys->registrationOptions($user, $request)
        );
    }

    public function register(
        PasskeyRegisterRequest $request,
        PasskeyService $passkeys,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        $record = $passkeys->register(
            $user,
            $request->validated('credential'),
            $request->validated('label'),
            $request,
        );

        return $this->success([
            'id' => $record->getKey(),
            'label' => $record->method?->label ?? 'Passkey',
            'created_at' => optional($record->created_at)->toIso8601String(),
            'last_used_at' => optional($record->last_used_at)->toIso8601String(),
        ]);
    }

    public function authenticationOptions(
        PasskeyOptionsRequest $request,
        PasskeyService $passkeys,
    ): JsonResponse {
        $payload = $request->validated();
        $user = null;

        if (filled($payload['email'] ?? null)) {
            $user = User::query()->where('email', strtolower((string) $payload['email']))->first();

            if (! $user) {
                throw ValidationException::withMessages([
                    'passkey' => ['No passkey is registered for this account.'],
                ]);
            }
        }

        return $this->success(
            $passkeys->authenticationOptions($user, $request)
        );
    }

    public function authenticate(
        PasskeyAuthenticateRequest $request,
        PasskeyService $passkeys,
        MfaService $mfa,
    ): JsonResponse {
        $user = $passkeys->authenticate($request->validated('credential'), $request);

        return $this->success([
            'status' => 'authenticated',
            'user' => (new AuthenticatedUserResource($user))->resolve($request),
        ])->cookie(cookie()->forget($mfa->pendingCookieName()));
    }

    public function rename(
        PasskeyRenameRequest $request,
        UserWebauthnCredential $credential,
        PasskeyService $passkeys,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        $passkeys->renameCredential($user, $credential, (string) $request->validated('label'));

        return $this->message('Passkey updated.');
    }

    public function destroy(
        MfaReauthRequest $request,
        UserWebauthnCredential $credential,
        PasskeyService $passkeys,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        $passkeys->removeCredential($user, $credential, (string) $request->validated('current_password'));

        return $this->message('Passkey removed.');
    }
}
