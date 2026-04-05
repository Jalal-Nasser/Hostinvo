<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ResendEmailVerificationRequest;
use App\Models\User;
use App\Services\Auth\EmailVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EmailVerificationController extends Controller
{
    public function verify(
        Request $request,
        string $id,
        string $hash,
        EmailVerificationService $verification,
    ): RedirectResponse {
        $user = User::query()->with('tenant')->findOrFail($id);

        if (! $request->hasValidSignature() || ! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return redirect()->away(
                $verification->verificationRedirectUrl($request, 'invalid', $user->email)
            );
        }

        $status = $user->hasVerifiedEmail() ? 'already_verified' : 'verified';

        $verification->verify($user);

        return redirect()->away(
            $verification->verificationRedirectUrl($request, $status, $user->email)
        );
    }

    public function resend(
        ResendEmailVerificationRequest $request,
        EmailVerificationService $verification,
    ): JsonResponse {
        $payload = $request->validated();

        $user = User::query()
            ->with('tenant')
            ->where('email', Str::lower((string) $payload['email']))
            ->where('email_verification_required', true)
            ->whereNull('email_verified_at')
            ->latest('created_at')
            ->first();

        if ($user) {
            $verification->send($user, $payload['locale'] ?? $user->locale);
        }

        return $this->message(__('auth.verification_link_sent'));
    }
}
