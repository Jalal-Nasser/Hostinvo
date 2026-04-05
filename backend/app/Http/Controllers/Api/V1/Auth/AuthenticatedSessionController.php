<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\Auth\AuthenticatedUserResource;
use App\Services\Auth\AuthService;
use App\Services\Auth\MfaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Request;

class AuthenticatedSessionController extends Controller
{
    public function store(
        LoginRequest $request,
        AuthService $authService,
        MfaService $mfa,
    ): JsonResponse
    {
        $result = $authService->login($request->validated(), $request);

        if ($result->status === 'authenticated') {
            return $this->success([
                'status' => $result->status,
                'user' => (new AuthenticatedUserResource($result->user))->resolve($request),
            ])->cookie(
                cookie(
                    $mfa->pendingCookieName(),
                    'authenticated',
                    max(1, 60 * 24 * 30),
                    '/',
                    null,
                    false,
                    false,
                    false,
                    'lax',
                )
            );
        }

        return $this->success([
            'status' => $result->status,
        ], status: Response::HTTP_ACCEPTED)->cookie(
            cookie(
                $mfa->pendingCookieName(),
                'mfa_pending',
                max(1, (int) config('security.mfa.pending_minutes', 10)),
                '/',
                null,
                false,
                true,
                false,
                'lax',
            )
        );
    }

    public function destroy(
        Request $request,
        AuthService $authService,
        MfaService $mfa,
    ): JsonResponse
    {
        $authService->logout($request);
        $mfa->clearPendingState($request);

        return $this->message(__('auth.logged_out'))->cookie(
            cookie()->forget($mfa->pendingCookieName())
        );
    }

    public function show(Request $request, AuthService $authService): AuthenticatedUserResource
    {
        return new AuthenticatedUserResource(
            $authService->currentUser($request->user())
        );
    }
}
