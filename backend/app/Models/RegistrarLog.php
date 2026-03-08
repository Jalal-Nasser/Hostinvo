<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistrarLog extends Model
{
    use HasFactory;
    use TenantAware;

    public const STATUS_SUCCESS = 'success';
    public const STATUS_FAILED = 'failed';

    public $timestamps = false;

    public const UPDATED_AT = null;

    protected $fillable = [
        'tenant_id',
        'domain_id',
        'operation',
        'status',
        'request_payload',
        'response_payload',
        'error_message',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'request_payload' => 'array',
            'response_payload' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }
}
