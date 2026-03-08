<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrderItem extends Model
{
    use HasFactory;
    use SoftDeletes;
    use TenantAware;

    protected $fillable = [
        'tenant_id',
        'order_id',
        'product_id',
        'product_name',
        'product_type',
        'billing_cycle',
        'quantity',
        'unit_price_minor',
        'setup_fee_minor',
        'discount_amount_minor',
        'subtotal_minor',
        'total_minor',
        'product_snapshot',
        'configurable_options',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price_minor' => 'integer',
            'setup_fee_minor' => 'integer',
            'discount_amount_minor' => 'integer',
            'subtotal_minor' => 'integer',
            'total_minor' => 'integer',
            'product_snapshot' => 'array',
            'configurable_options' => 'array',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
