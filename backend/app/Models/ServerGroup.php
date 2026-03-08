<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ServerGroup extends Model
{
    use HasFactory;
    use SoftDeletes;
    use TenantAware;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_MAINTENANCE = 'maintenance';

    public const STRATEGY_LEAST_ACCOUNTS = 'least_accounts';

    protected $fillable = [
        'tenant_id',
        'name',
        'selection_strategy',
        'fill_type',
        'status',
        'notes',
    ];

    public static function statuses(): array
    {
        return [
            self::STATUS_ACTIVE,
            self::STATUS_INACTIVE,
            self::STATUS_MAINTENANCE,
        ];
    }

    public static function strategies(): array
    {
        return [
            self::STRATEGY_LEAST_ACCOUNTS,
        ];
    }

    public function servers(): HasMany
    {
        return $this->hasMany(Server::class)->orderBy('name');
    }
}
