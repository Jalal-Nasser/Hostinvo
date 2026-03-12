<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class License extends Model
{
    use HasFactory;
    use HasUuids;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_REVOKED = 'revoked';
    public const STATUS_EXPIRED = 'expired';

    public const PLAN_STARTER = 'starter';
    public const PLAN_PROFESSIONAL = 'professional';
    public const PLAN_ENTERPRISE = 'enterprise';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'license_key',
        'owner_email',
        'plan',
        'status',
        'max_clients',
        'max_services',
        'activation_limit',
        'issued_at',
        'expires_at',
        'last_validated_at',
        'metadata',
    ];

    protected $guarded = [
        'tenant_id',
    ];

    protected function casts(): array
    {
        return [
            'max_clients' => 'integer',
            'max_services' => 'integer',
            'activation_limit' => 'integer',
            'issued_at' => 'datetime',
            'expires_at' => 'datetime',
            'last_validated_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public static function statuses(): array
    {
        return [
            self::STATUS_ACTIVE,
            self::STATUS_SUSPENDED,
            self::STATUS_REVOKED,
            self::STATUS_EXPIRED,
        ];
    }

    public static function plans(): array
    {
        return [
            self::PLAN_STARTER,
            self::PLAN_PROFESSIONAL,
            self::PLAN_ENTERPRISE,
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function activations(): HasMany
    {
        return $this->hasMany(LicenseActivation::class)->latest('activated_at');
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE && ! $this->isExpired();
    }
}
