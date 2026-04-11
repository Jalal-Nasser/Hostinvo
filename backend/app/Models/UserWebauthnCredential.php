<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserWebauthnCredential extends Model
{
    protected $fillable = [
        'user_id',
        'mfa_method_id',
        'credential_id',
        'public_key',
        'sign_count',
        'aaguid',
        'transports',
        'last_used_at',
    ];

    protected function casts(): array
    {
        return [
            'transports' => 'array',
            'last_used_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function method(): BelongsTo
    {
        return $this->belongsTo(UserMfaMethod::class, 'mfa_method_id');
    }
}
