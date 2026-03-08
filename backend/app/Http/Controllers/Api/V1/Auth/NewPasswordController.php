<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Services\Auth\AuthService;
use Illuminate\Http\JsonResponse;

class NewPasswordController extends Controller
{
    public function store(ResetPasswordRequest $request, AuthService $authService): JsonResponse
    {
        return $this->message(
            $authService->resetPassword($request->validated())
        );
    }
}
