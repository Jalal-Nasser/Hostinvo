<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Domain extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;
    use TenantAware;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_PENDING_TRANSFER = 'pending_transfer';
    public const STATUS_PENDING_DELETE = 'pending_delete';
    public const STATUS_CANCELLED = 'cancelled';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id',
        'client_id',
        'service_id',
        'domain',
        'tld',
        'status',
        'registrar',
        'registration_date',
        'expiry_date',
        'auto_renew',
        'dns_management',
        'id_protection',
        'renewal_price',
        'currency',
        'notes',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'registration_date' => 'date',
            'expiry_date' => 'date',
            'auto_renew' => 'boolean',
            'dns_management' => 'boolean',
            'id_protection' => 'boolean',
            'renewal_price' => 'integer',
            'metadata' => 'array',
        ];
    }

    public static function statuses(): array
    {
        return [
            self::STATUS_ACTIVE,
            self::STATUS_EXPIRED,
            self::STATUS_PENDING_TRANSFER,
            self::STATUS_PENDING_DELETE,
            self::STATUS_CANCELLED,
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(DomainContact::class)->orderBy('type');
    }

    public function renewals(): HasMany
    {
        return $this->hasMany(DomainRenewal::class)->latest('created_at');
    }

    public function registrarLogs(): HasMany
    {
        return $this->hasMany(RegistrarLog::class)->latest('created_at');
    }
}
