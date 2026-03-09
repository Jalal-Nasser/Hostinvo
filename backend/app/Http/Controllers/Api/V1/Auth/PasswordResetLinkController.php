<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Services\Auth\AuthService;
use Illuminate\Http\JsonResponse;

class PasswordResetLinkController extends Controller
{
    public function store(ForgotPasswordRequest $request, AuthService $authService): JsonResponse
    {
        return $this->message(
            $authService->sendPasswordResetLink($request->validated('email'), $request)
        );
    }
}
