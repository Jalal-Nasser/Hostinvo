<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DomainRenewal extends Model
{
    use HasFactory;
    use TenantAware;

    public const STATUS_PENDING = 'pending';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    public $timestamps = false;

    public const UPDATED_AT = null;

    protected $fillable = [
        'tenant_id',
        'domain_id',
        'years',
        'price',
        'status',
        'renewed_at',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'years' => 'integer',
            'price' => 'integer',
            'renewed_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_COMPLETED,
            self::STATUS_FAILED,
        ];
    }

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }
}
