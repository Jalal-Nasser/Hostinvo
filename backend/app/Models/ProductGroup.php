<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductGroup extends Model
{
    use HasFactory;
    use TenantAware;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';

    public const VISIBILITY_PUBLIC = 'public';
    public const VISIBILITY_PRIVATE = 'private';
    public const VISIBILITY_HIDDEN = 'hidden';

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'description',
        'status',
        'visibility',
        'display_order',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'display_order' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class)->orderBy('display_order');
    }
}
