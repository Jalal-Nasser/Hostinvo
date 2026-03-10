<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use App\Support\Security\ContentSanitizer;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ticket extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;
    use TenantAware;

    public const PRIORITY_LOW = 'low';
    public const PRIORITY_MEDIUM = 'medium';
    public const PRIORITY_HIGH = 'high';
    public const PRIORITY_URGENT = 'urgent';

    public const SOURCE_PORTAL = 'portal';
    public const SOURCE_ADMIN = 'admin';

    public const REPLY_BY_CLIENT = 'client';
    public const REPLY_BY_ADMIN = 'admin';
    public const REPLY_BY_INTERNAL = 'internal';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id',
        'department_id',
        'status_id',
        'client_id',
        'client_contact_id',
        'opened_by_user_id',
        'assigned_to_user_id',
        'service_id',
        'ticket_number',
        'subject',
        'priority',
        'source',
        'status',
        'last_reply_by',
        'last_reply_at',
        'last_client_reply_at',
        'last_admin_reply_at',
        'closed_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'last_reply_at' => 'datetime',
            'last_client_reply_at' => 'datetime',
            'last_admin_reply_at' => 'datetime',
            'closed_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    protected function subject(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value): ?string => app(ContentSanitizer::class)->plainText($value)
        );
    }

    public static function priorities(): array
    {
        return [
            self::PRIORITY_LOW,
            self::PRIORITY_MEDIUM,
            self::PRIORITY_HIGH,
            self::PRIORITY_URGENT,
        ];
    }

    public static function sources(): array
    {
        return [
            self::SOURCE_PORTAL,
            self::SOURCE_ADMIN,
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(TicketDepartment::class, 'department_id');
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(TicketStatus::class, 'status_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function clientContact(): BelongsTo
    {
        return $this->belongsTo(ClientContact::class, 'client_contact_id');
    }

    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by_user_id');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(TicketReply::class)->oldest();
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
