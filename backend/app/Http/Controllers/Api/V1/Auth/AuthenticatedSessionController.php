<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\Auth\AuthenticatedUserResource;
use App\Services\Auth\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthenticatedSessionController extends Controller
{
    public function store(LoginRequest $request, AuthService $authService): AuthenticatedUserResource
    {
        return new AuthenticatedUserResource(
            $authService->login($request->validated(), $request)
        );
    }

    public function destroy(Request $request, AuthService $authService): JsonResponse
    {
        $authService->logout($request);

        return $this->message(__('auth.logged_out'));
    }

    public function show(Request $request, AuthService $authService): AuthenticatedUserResource
    {
        return new AuthenticatedUserResource(
            $authService->currentUser($request->user())
        );
    }
}
