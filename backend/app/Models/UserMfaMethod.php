<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserMfaMethod extends Model
{
    use HasFactory;

    public const TYPE_TOTP = 'totp';

    protected $fillable = [
        'user_id',
        'type',
        'label',
        'secret',
        'metadata',
        'confirmed_at',
        'last_used_at',
        'disabled_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'confirmed_at' => 'datetime',
            'last_used_at' => 'datetime',
            'disabled_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isConfirmed(): bool
    {
        return $this->confirmed_at !== null && $this->disabled_at === null;
    }
}
