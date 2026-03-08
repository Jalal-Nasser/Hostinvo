<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProvisioningLog extends Model
{
    use HasFactory;
    use TenantAware;

    public const STATUS_QUEUED = 'queued';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_PLACEHOLDER = 'placeholder';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'tenant_id',
        'provisioning_job_id',
        'service_id',
        'server_id',
        'operation',
        'status',
        'driver',
        'message',
        'request_payload',
        'response_payload',
        'error_message',
        'duration_ms',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'request_payload' => 'array',
            'response_payload' => 'array',
            'duration_ms' => 'integer',
            'occurred_at' => 'datetime',
        ];
    }

    public function provisioningJob(): BelongsTo
    {
        return $this->belongsTo(ProvisioningJob::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }
}
