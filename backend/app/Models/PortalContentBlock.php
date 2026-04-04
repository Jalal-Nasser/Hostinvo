<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PortalContentBlock extends Model
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
        'section',
        'key',
        'title_en',
        'title_ar',
        'body_en',
        'body_ar',
        'cta_label_en',
        'cta_label_ar',
        'cta_href',
        'status',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }
}
