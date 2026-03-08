<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TicketStatus extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;
    use TenantAware;

    public const CODE_OPEN = 'open';
    public const CODE_ANSWERED = 'answered';
    public const CODE_CUSTOMER_REPLY = 'customer_reply';
    public const CODE_IN_PROGRESS = 'in_progress';
    public const CODE_ON_HOLD = 'on_hold';
    public const CODE_CLOSED = 'closed';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id',
        'name',
        'code',
        'color',
        'is_default',
        'is_closed',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'is_closed' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    public static function defaultCatalog(): array
    {
        return [
            ['name' => 'Open', 'code' => self::CODE_OPEN, 'color' => 'amber', 'is_default' => true, 'is_closed' => false, 'display_order' => 10],
            ['name' => 'Answered', 'code' => self::CODE_ANSWERED, 'color' => 'emerald', 'is_default' => false, 'is_closed' => false, 'display_order' => 20],
            ['name' => 'Customer Reply', 'code' => self::CODE_CUSTOMER_REPLY, 'color' => 'rose', 'is_default' => false, 'is_closed' => false, 'display_order' => 30],
            ['name' => 'In Progress', 'code' => self::CODE_IN_PROGRESS, 'color' => 'sky', 'is_default' => false, 'is_closed' => false, 'display_order' => 40],
            ['name' => 'On Hold', 'code' => self::CODE_ON_HOLD, 'color' => 'slate', 'is_default' => false, 'is_closed' => false, 'display_order' => 50],
            ['name' => 'Closed', 'code' => self::CODE_CLOSED, 'color' => 'zinc', 'is_default' => false, 'is_closed' => true, 'display_order' => 60],
        ];
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'status_id')->latest();
    }
}
