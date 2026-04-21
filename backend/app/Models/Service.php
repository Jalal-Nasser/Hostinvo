<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Service extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;
    use TenantAware;

    public const TYPE_HOSTING = 'hosting';

    public const STATUS_PENDING = 'pending';
    public const STATUS_PROVISIONING = 'provisioning';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_TERMINATED = 'terminated';
    public const STATUS_FAILED = 'failed';

    public const PROVISIONING_IDLE = 'idle';
    public const PROVISIONING_QUEUED = 'queued';
    public const PROVISIONING_PROCESSING = 'processing';
    public const PROVISIONING_PLACEHOLDER = 'placeholder';
    public const PROVISIONING_SYNCED = 'synced';
    public const PROVISIONING_FAILED = 'failed';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'client_id',
        'product_id',
        'order_id',
        'order_item_id',
        'server_id',
        'server_package_id',
        'reference_number',
        'service_type',
        'billing_cycle',
        'price',
        'currency',
        'domain',
        'username',
        'registration_date',
        'next_due_date',
        'termination_date',
        'notes',
        'metadata',
    ];

    protected $guarded = [
        'tenant_id',
        'user_id',
        'status',
        'provisioning_state',
        'external_reference',
        'last_operation',
        'activated_at',
        'suspended_at',
        'terminated_at',
        'last_synced_at',
    ];

    protected function casts(): array
    {
        return [
            'registration_date' => 'date',
            'next_due_date' => 'date',
            'termination_date' => 'date',
            'price' => 'integer',
            'activated_at' => 'datetime',
            'suspended_at' => 'datetime',
            'terminated_at' => 'datetime',
            'last_synced_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_PROVISIONING,
            self::STATUS_ACTIVE,
            self::STATUS_SUSPENDED,
            self::STATUS_TERMINATED,
            self::STATUS_FAILED,
        ];
    }

    public static function provisioningStates(): array
    {
        return [
            self::PROVISIONING_IDLE,
            self::PROVISIONING_QUEUED,
            self::PROVISIONING_PROCESSING,
            self::PROVISIONING_PLACEHOLDER,
            self::PROVISIONING_SYNCED,
            self::PROVISIONING_FAILED,
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    public function serverPackage(): BelongsTo
    {
        return $this->belongsTo(ServerPackage::class);
    }

    public function credentials(): HasOne
    {
        return $this->hasOne(ServiceCredential::class);
    }

    public function usage(): HasOne
    {
        return $this->hasOne(ServiceUsage::class);
    }

    public function suspensions(): HasMany
    {
        return $this->hasMany(ServiceSuspension::class)->latest('suspended_at');
    }

    public function provisioningJobs(): HasMany
    {
        return $this->hasMany(ProvisioningJob::class)->latest('requested_at');
    }

    public function provisioningLogs(): HasMany
    {
        return $this->hasMany(ProvisioningLog::class)->latest('occurred_at');
    }

    public function domains(): HasMany
    {
        return $this->hasMany(Domain::class)->latest('expiry_date');
    }
}
