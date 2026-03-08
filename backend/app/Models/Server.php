<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Server extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;
    use TenantAware;

    public const PANEL_CPANEL = 'cpanel';
    public const PANEL_PLESK = 'plesk';

    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_MAINTENANCE = 'maintenance';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id',
        'server_group_id',
        'name',
        'hostname',
        'panel_type',
        'api_endpoint',
        'api_port',
        'status',
        'verify_ssl',
        'max_accounts',
        'current_accounts',
        'username',
        'credentials',
        'last_tested_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'api_port' => 'integer',
            'verify_ssl' => 'boolean',
            'max_accounts' => 'integer',
            'current_accounts' => 'integer',
            'credentials' => 'encrypted:array',
            'last_tested_at' => 'datetime',
        ];
    }

    public static function panelTypes(): array
    {
        return [
            self::PANEL_CPANEL,
            self::PANEL_PLESK,
        ];
    }

    public static function statuses(): array
    {
        return [
            self::STATUS_ACTIVE,
            self::STATUS_INACTIVE,
            self::STATUS_MAINTENANCE,
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(ServerGroup::class, 'server_group_id');
    }

    public function packages(): HasMany
    {
        return $this->hasMany(ServerPackage::class)->orderBy('panel_package_name');
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class)->latest();
    }

    public function provisioningJobs(): HasMany
    {
        return $this->hasMany(ProvisioningJob::class)->latest('requested_at');
    }

    public function provisioningLogs(): HasMany
    {
        return $this->hasMany(ProvisioningLog::class)->latest('occurred_at');
    }
}
