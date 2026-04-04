<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Announcement extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;
    use TenantAware;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_ARCHIVED = 'archived';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id',
        'slug',
        'title_en',
        'title_ar',
        'excerpt_en',
        'excerpt_ar',
        'body_en',
        'body_ar',
        'status',
        'is_featured',
        'sort_order',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'is_featured' => 'boolean',
            'sort_order' => 'integer',
            'published_at' => 'datetime',
        ];
    }
}
