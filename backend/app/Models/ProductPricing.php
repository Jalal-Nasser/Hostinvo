<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPricing extends Model
{
    use HasFactory;
    use HasUuids;
    use TenantAware;

    public const CYCLE_MONTHLY = 'monthly';
    public const CYCLE_QUARTERLY = 'quarterly';
    public const CYCLE_SEMIANNUALLY = 'semiannually';
    public const CYCLE_ANNUALLY = 'annually';
    public const CYCLE_BIENNIALLY = 'biennially';
    public const CYCLE_TRIENNIALLY = 'triennially';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'product_pricing';

    protected $fillable = [
        'tenant_id',
        'product_id',
        'billing_cycle',
        'currency',
        'price',
        'setup_fee',
        'is_enabled',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'setup_fee' => 'decimal:2',
            'is_enabled' => 'boolean',
        ];
    }

    public static function billingCycles(): array
    {
        return [
            self::CYCLE_MONTHLY,
            self::CYCLE_QUARTERLY,
            self::CYCLE_SEMIANNUALLY,
            self::CYCLE_ANNUALLY,
            self::CYCLE_BIENNIALLY,
            self::CYCLE_TRIENNIALLY,
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
