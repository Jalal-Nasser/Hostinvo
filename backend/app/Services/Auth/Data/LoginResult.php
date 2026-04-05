<?php

namespace App\Services\Auth\Data;

use App\Models\User;

class LoginResult
{
    public function __construct(
        public readonly string $status,
        public readonly ?User $user = null,
        public readonly ?string $message = null,
    ) {
    }

    public static function authenticated(User $user): self
    {
        return new self('authenticated', $user);
    }

    public static function mfaRequired(string $status): self
    {
        return new self($status, null);
    }
}
