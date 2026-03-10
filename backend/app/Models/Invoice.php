<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use App\Support\Security\ContentSanitizer;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;
    use TenantAware;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_UNPAID = 'unpaid';
    public const STATUS_PAID = 'paid';
    public const STATUS_OVERDUE = 'overdue';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_REFUNDED = 'refunded';

    public const DISCOUNT_FIXED = 'fixed';
    public const DISCOUNT_PERCENTAGE = 'percentage';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'client_id',
        'order_id',
        'user_id',
        'reference_number',
        'status',
        'currency',
        'issue_date',
        'due_date',
        'paid_at',
        'cancelled_at',
        'refunded_at',
        'recurring_cycle',
        'next_invoice_date',
        'discount_type',
        'discount_value',
        'discount_amount_minor',
        'credit_applied_minor',
        'tax_rate_bps',
        'tax_amount_minor',
        'subtotal_minor',
        'total_minor',
        'amount_paid_minor',
        'refunded_amount_minor',
        'balance_due_minor',
        'notes',
        'metadata',
    ];

    protected $guarded = [
        'tenant_id',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'due_date' => 'date',
            'paid_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'refunded_at' => 'datetime',
            'next_invoice_date' => 'date',
            'discount_value' => 'integer',
            'discount_amount_minor' => 'integer',
            'credit_applied_minor' => 'integer',
            'tax_rate_bps' => 'integer',
            'tax_amount_minor' => 'integer',
            'subtotal_minor' => 'integer',
            'total_minor' => 'integer',
            'amount_paid_minor' => 'integer',
            'refunded_amount_minor' => 'integer',
            'balance_due_minor' => 'integer',
            'metadata' => 'array',
        ];
    }

    protected function notes(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value): ?string => app(ContentSanitizer::class)->plainText($value)
        );
    }

    public static function statuses(): array
    {
        return [
            self::STATUS_DRAFT,
            self::STATUS_UNPAID,
            self::STATUS_PAID,
            self::STATUS_OVERDUE,
            self::STATUS_CANCELLED,
            self::STATUS_REFUNDED,
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

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class)->orderBy('created_at');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->latest('paid_at');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class)->latest('occurred_at');
    }
}
