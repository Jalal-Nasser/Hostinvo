<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WebhookLog extends Model
{
    use HasFactory;
    use HasUuids;
    use TenantAware;

    public const STATUS_RECEIVED = 'received';
    public const STATUS_PROCESSED = 'processed';
    public const STATUS_IGNORED = 'ignored';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_FAILED = 'failed';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id',
        'gateway',
        'event_type',
        'status',
        'external_reference',
        'signature',
        'request_headers',
        'payload',
        'processed_at',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'request_headers' => 'array',
            'payload' => 'array',
            'processed_at' => 'datetime',
        ];
    }

    public static function statuses(): array
    {
        return [
            self::STATUS_RECEIVED,
            self::STATUS_PROCESSED,
            self::STATUS_IGNORED,
            self::STATUS_REJECTED,
            self::STATUS_FAILED,
        ];
    }
}
