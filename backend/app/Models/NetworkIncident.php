<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class NetworkIncident extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;
    use TenantAware;

    public const STATUS_OPEN = 'open';
    public const STATUS_MONITORING = 'monitoring';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_MAINTENANCE = 'maintenance';

    public const SEVERITY_INFO = 'info';
    public const SEVERITY_WARNING = 'warning';
    public const SEVERITY_CRITICAL = 'critical';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id',
        'slug',
        'title_en',
        'title_ar',
        'summary_en',
        'summary_ar',
        'details_en',
        'details_ar',
        'status',
        'severity',
        'is_public',
        'sort_order',
        'started_at',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'sort_order' => 'integer',
            'started_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }
}
