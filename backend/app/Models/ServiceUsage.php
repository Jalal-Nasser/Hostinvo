<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceUsage extends Model
{
    use HasFactory;
    use HasUuids;
    use TenantAware;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'service_usage';

    protected $fillable = [
        'tenant_id',
        'service_id',
        'disk_used_mb',
        'disk_limit_mb',
        'bandwidth_used_mb',
        'bandwidth_limit_mb',
        'email_accounts_used',
        'databases_used',
        'last_synced_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'disk_used_mb' => 'integer',
            'disk_limit_mb' => 'integer',
            'bandwidth_used_mb' => 'integer',
            'bandwidth_limit_mb' => 'integer',
            'email_accounts_used' => 'integer',
            'databases_used' => 'integer',
            'last_synced_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
