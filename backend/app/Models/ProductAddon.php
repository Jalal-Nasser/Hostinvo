<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductAddon extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;
    use TenantAware;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_HIDDEN = 'hidden';
    public const STATUS_ARCHIVED = 'archived';

    public const VISIBILITY_VISIBLE = 'visible';
    public const VISIBILITY_HIDDEN = 'hidden';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'description',
        'status',
        'visibility',
        'apply_tax',
        'auto_activate',
        'welcome_email',
    ];

    protected function casts(): array
    {
        return [
            'apply_tax' => 'boolean',
            'auto_activate' => 'boolean',
        ];
    }

    public function pricing(): HasMany
    {
        return $this->hasMany(ProductAddonPricing::class)->orderBy('billing_cycle');
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_addon_products')
            ->withTimestamps()
            ->latest();
    }
}
