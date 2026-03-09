<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProvisioningJob extends Model
{
    use HasFactory;
    use HasUuids;
    use TenantAware;

    public const OPERATION_CREATE_ACCOUNT = 'create_account';
    public const OPERATION_SUSPEND_ACCOUNT = 'suspend_account';
    public const OPERATION_UNSUSPEND_ACCOUNT = 'unsuspend_account';
    public const OPERATION_TERMINATE_ACCOUNT = 'terminate_account';
    public const OPERATION_CHANGE_PACKAGE = 'change_package';
    public const OPERATION_RESET_PASSWORD = 'reset_password';
    public const OPERATION_SYNC_USAGE = 'sync_usage';
    public const OPERATION_SYNC_SERVICE_STATUS = 'sync_service_status';

    public const STATUS_QUEUED = 'queued';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [
        'tenant_id',
        'service_id',
        'server_id',
        'requested_by_user_id',
        'operation',
        'status',
        'driver',
        'queue_name',
        'attempts',
        'payload',
        'result_payload',
        'error_message',
        'requested_at',
        'started_at',
        'completed_at',
        'failed_at',
    ];

    protected function casts(): array
    {
        return [
            'attempts' => 'integer',
            'payload' => 'array',
            'result_payload' => 'array',
            'requested_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    public static function operations(): array
    {
        return [
            self::OPERATION_CREATE_ACCOUNT,
            self::OPERATION_SUSPEND_ACCOUNT,
            self::OPERATION_UNSUSPEND_ACCOUNT,
            self::OPERATION_TERMINATE_ACCOUNT,
            self::OPERATION_CHANGE_PACKAGE,
            self::OPERATION_RESET_PASSWORD,
            self::OPERATION_SYNC_USAGE,
            self::OPERATION_SYNC_SERVICE_STATUS,
        ];
    }

    public static function statuses(): array
    {
        return [
            self::STATUS_QUEUED,
            self::STATUS_PROCESSING,
            self::STATUS_COMPLETED,
            self::STATUS_FAILED,
        ];
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(ProvisioningLog::class)->latest('occurred_at');
    }
}
