<?php

use App\Http\Controllers\Api\V1\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Api\V1\Auth\AuthConfigController;
use App\Http\Controllers\Api\V1\Auth\EmailVerificationController;
use App\Http\Controllers\Api\V1\Auth\MfaController;
use App\Http\Controllers\Api\V1\Auth\NewPasswordController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetLinkController;
use App\Http\Controllers\Api\V1\Auth\PasskeyController;
use App\Http\Controllers\Api\V1\Auth\ProviderOnboardingController;
use Illuminate\Support\Facades\Route;

Route::get('/config', AuthConfigController::class)->name('config');

Route::middleware('throttle:auth')->group(function (): void {
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login');
    Route::post('/provider-register', [ProviderOnboardingController::class, 'register'])->name('provider.register');
    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');
    Route::post('/reset-password', [NewPasswordController::class, 'store'])->name('password.store');
    Route::post('/verify-email/resend', [EmailVerificationController::class, 'resend'])->name('verification.resend');
    Route::get('/verify-email/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware(['signed', 'throttle:auth'])
        ->name('verification.verify');
    Route::get('/mfa/status', [MfaController::class, 'status'])->name('mfa.status');
    Route::post('/mfa/setup', [MfaController::class, 'setup'])->name('mfa.setup');
    Route::post('/mfa/setup/confirm', [MfaController::class, 'confirmSetup'])->name('mfa.setup.confirm');
    Route::post('/mfa/challenge', [MfaController::class, 'challenge'])->name('mfa.challenge');
    Route::post('/passkeys/authenticate/options', [PasskeyController::class, 'authenticationOptions'])->name('passkeys.authenticate.options');
    Route::post('/passkeys/authenticate/verify', [PasskeyController::class, 'authenticate'])->name('passkeys.authenticate.verify');
});

Route::middleware(['auth:sanctum'])->group(function (): void {
    Route::get('/passkeys', [PasskeyController::class, 'index'])->name('passkeys.index');
    Route::post('/passkeys/register/options', [PasskeyController::class, 'registrationOptions'])->name('passkeys.register.options');
    Route::post('/passkeys/register/verify', [PasskeyController::class, 'register'])->name('passkeys.register.verify');
    Route::put('/passkeys/{credential}', [PasskeyController::class, 'rename'])->name('passkeys.rename');
    Route::delete('/passkeys/{credential}', [PasskeyController::class, 'destroy'])->name('passkeys.destroy');
});

Route::middleware(['auth:sanctum', 'resolve.tenant'])->group(function (): void {
    Route::get('/me', [AuthenticatedSessionController::class, 'show'])->name('me');
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    Route::get('/onboarding/status', [ProviderOnboardingController::class, 'status'])->name('onboarding.status');
    Route::put('/onboarding/company', [ProviderOnboardingController::class, 'updateCompany'])->name('onboarding.company.update');
    Route::post('/mfa/recovery-codes/regenerate', [MfaController::class, 'regenerateRecoveryCodes'])->name('mfa.recovery-codes.regenerate');
    Route::delete('/mfa/totp', [MfaController::class, 'disable'])->name('mfa.disable');
});
