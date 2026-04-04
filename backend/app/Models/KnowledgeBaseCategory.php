<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class KnowledgeBaseCategory extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;
    use TenantAware;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id',
        'slug',
        'name_en',
        'name_ar',
        'description_en',
        'description_ar',
        'status',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function articles(): HasMany
    {
        return $this->hasMany(KnowledgeBaseArticle::class, 'category_id')->latest('published_at');
    }
}
