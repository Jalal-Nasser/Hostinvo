<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketReply extends Model
{
    use HasFactory;
    use HasUuids;
    use TenantAware;

    public const TYPE_CLIENT = 'client';
    public const TYPE_ADMIN = 'admin';
    public const TYPE_INTERNAL_NOTE = 'internal_note';
    public const TYPE_SYSTEM = 'system';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id',
        'ticket_id',
        'user_id',
        'client_contact_id',
        'reply_type',
        'is_internal',
        'message',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'is_internal' => 'boolean',
            'metadata' => 'array',
        ];
    }

    public static function types(): array
    {
        return [
            self::TYPE_CLIENT,
            self::TYPE_ADMIN,
            self::TYPE_INTERNAL_NOTE,
            self::TYPE_SYSTEM,
        ];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function clientContact(): BelongsTo
    {
        return $this->belongsTo(ClientContact::class, 'client_contact_id');
    }
}
