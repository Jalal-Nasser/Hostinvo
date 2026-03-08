<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;
    use HasUuids;
    use TenantAware;

    public const TYPE_HOSTING = 'hosting';

    public const STATUS_DRAFT = 'draft';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_ARCHIVED = 'archived';

    public const VISIBILITY_PUBLIC = 'public';
    public const VISIBILITY_PRIVATE = 'private';
    public const VISIBILITY_HIDDEN = 'hidden';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id',
        'product_group_id',
        'type',
        'name',
        'slug',
        'sku',
        'summary',
        'description',
        'status',
        'visibility',
        'display_order',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'display_order' => 'integer',
            'is_featured' => 'boolean',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(ProductGroup::class, 'product_group_id');
    }

    public function pricing(): HasMany
    {
        return $this->hasMany(ProductPricing::class)->orderBy('billing_cycle');
    }

    public function configurableOptions(): HasMany
    {
        return $this->hasMany(ConfigurableOption::class)->orderBy('display_order');
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class)->latest();
    }
}
