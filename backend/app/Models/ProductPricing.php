<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPricing extends Model
{
    use HasFactory;
    use TenantAware;

    public const CYCLE_MONTHLY = 'monthly';
    public const CYCLE_QUARTERLY = 'quarterly';
    public const CYCLE_SEMIANNUALLY = 'semiannually';
    public const CYCLE_ANNUALLY = 'annually';
    public const CYCLE_BIENNIALLY = 'biennially';
    public const CYCLE_TRIENNIALLY = 'triennially';

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
            'is_enabled' => 'boolean',
        ];
    }

    protected function price(): Attribute
    {
        return Attribute::make(
            get: fn (mixed $value): string => $this->minorToDecimal((int) ($value ?? 0)),
            set: fn (mixed $value): int => $this->decimalToMinor($value),
        );
    }

    protected function setupFee(): Attribute
    {
        return Attribute::make(
            get: fn (mixed $value): string => $this->minorToDecimal((int) ($value ?? 0)),
            set: fn (mixed $value): int => $this->decimalToMinor($value),
        );
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

    private function decimalToMinor(mixed $value): int
    {
        $normalized = preg_replace('/[^0-9.\-]/', '', trim((string) $value)) ?? '0';

        if ($normalized === '' || $normalized === '-') {
            return 0;
        }

        $negative = str_starts_with($normalized, '-');
        $unsigned = ltrim($normalized, '-');
        [$whole, $decimal] = array_pad(explode('.', $unsigned, 2), 2, '0');
        $minor = ((int) $whole * 100) + (int) str_pad(substr($decimal, 0, 2), 2, '0');

        return $negative ? $minor * -1 : $minor;
    }

    private function minorToDecimal(int $value): string
    {
        $negative = $value < 0;
        $absolute = abs($value);
        $whole = intdiv($absolute, 100);
        $decimal = str_pad((string) ($absolute % 100), 2, '0', STR_PAD_LEFT);

        return sprintf('%s%d.%s', $negative ? '-' : '', $whole, $decimal);
    }
}
