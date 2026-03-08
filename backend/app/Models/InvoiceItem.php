<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class InvoiceItem extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;
    use TenantAware;

    public const TYPE_MANUAL = 'manual';
    public const TYPE_ORDER = 'order';
    public const TYPE_SERVICE = 'service';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id',
        'invoice_id',
        'order_item_id',
        'item_type',
        'description',
        'related_type',
        'related_id',
        'billing_cycle',
        'billing_period_starts_at',
        'billing_period_ends_at',
        'quantity',
        'unit_price_minor',
        'subtotal_minor',
        'discount_amount_minor',
        'tax_amount_minor',
        'total_minor',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'billing_period_starts_at' => 'date',
            'billing_period_ends_at' => 'date',
            'quantity' => 'integer',
            'unit_price_minor' => 'integer',
            'subtotal_minor' => 'integer',
            'discount_amount_minor' => 'integer',
            'tax_amount_minor' => 'integer',
            'total_minor' => 'integer',
            'metadata' => 'array',
        ];
    }

    public static function types(): array
    {
        return [
            self::TYPE_MANUAL,
            self::TYPE_ORDER,
            self::TYPE_SERVICE,
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }
}
