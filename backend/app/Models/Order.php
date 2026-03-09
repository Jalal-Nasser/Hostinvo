<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;
    use TenantAware;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PENDING = 'pending';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_FRAUD = 'fraud';
    public const STATUS_COMPLETED = 'completed';

    public const DISCOUNT_FIXED = 'fixed';
    public const DISCOUNT_PERCENTAGE = 'percentage';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'client_id',
        'user_id',
        'reference_number',
        'status',
        'currency',
        'coupon_code',
        'discount_type',
        'discount_value',
        'discount_amount_minor',
        'tax_rate_bps',
        'tax_amount_minor',
        'subtotal_minor',
        'total_minor',
        'notes',
        'placed_at',
        'accepted_at',
        'completed_at',
        'cancelled_at',
    ];

    protected $guarded = [
        'tenant_id',
    ];

    protected function casts(): array
    {
        return [
            'discount_value' => 'integer',
            'discount_amount_minor' => 'integer',
            'tax_rate_bps' => 'integer',
            'tax_amount_minor' => 'integer',
            'subtotal_minor' => 'integer',
            'total_minor' => 'integer',
            'placed_at' => 'datetime',
            'accepted_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public static function statuses(): array
    {
        return [
            self::STATUS_DRAFT,
            self::STATUS_PENDING,
            self::STATUS_ACCEPTED,
            self::STATUS_CANCELLED,
            self::STATUS_FRAUD,
            self::STATUS_COMPLETED,
        ];
    }

    public static function discountTypes(): array
    {
        return [
            self::DISCOUNT_FIXED,
            self::DISCOUNT_PERCENTAGE,
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class)->orderBy('created_at');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class)->latest('issue_date');
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class)->latest();
    }
}
