<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;
    use TenantAware;

    public const TYPE_HOSTING = 'hosting';

    public const PAYMENT_TYPE_FREE = 'free';
    public const PAYMENT_TYPE_ONE_TIME = 'onetime';
    public const PAYMENT_TYPE_RECURRING = 'recurring';

    public const MULTIPLE_QUANTITIES_NO = 'no';
    public const MULTIPLE_QUANTITIES_MULTIPLE_SERVICES = 'multiple_services';
    public const MULTIPLE_QUANTITIES_SCALABLE = 'scalable';

    public const MODULE_CPANEL = 'cpanel';
    public const MODULE_PLESK = 'plesk';
    public const MODULE_DIRECTADMIN = 'directadmin';
    public const MODULE_CUSTOM = 'custom';

    public const STATUS_DRAFT = 'draft';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_ARCHIVED = 'archived';

    public const VISIBILITY_PUBLIC = 'public';
    public const VISIBILITY_PRIVATE = 'private';
    public const VISIBILITY_HIDDEN = 'hidden';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id',
        'product_group_id',
        'server_id',
        'type',
        'provisioning_module',
        'provisioning_package',
        'name',
        'tagline',
        'slug',
        'sku',
        'summary',
        'description',
        'color',
        'status',
        'visibility',
        'display_order',
        'is_featured',
        'welcome_email',
        'require_domain',
        'stock_control',
        'stock_quantity',
        'apply_tax',
        'retired',
        'payment_type',
        'allow_multiple_quantities',
        'recurring_cycles_limit',
        'auto_terminate_days',
        'termination_email',
        'prorata_billing',
        'prorata_date',
        'charge_next_month',
    ];

    protected function casts(): array
    {
        return [
            'display_order' => 'integer',
            'is_featured' => 'boolean',
            'require_domain' => 'boolean',
            'stock_control' => 'boolean',
            'stock_quantity' => 'integer',
            'apply_tax' => 'boolean',
            'retired' => 'boolean',
            'recurring_cycles_limit' => 'integer',
            'auto_terminate_days' => 'integer',
            'prorata_billing' => 'boolean',
            'prorata_date' => 'integer',
            'charge_next_month' => 'integer',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(ProductGroup::class, 'product_group_id');
    }

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    public function pricing(): HasMany
    {
        return $this->hasMany(ProductPricing::class)->orderBy('billing_cycle');
    }

    public function configurableOptions(): HasMany
    {
        return $this->hasMany(ConfigurableOption::class)->orderBy('display_order');
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class)->latest();
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class)->latest();
    }

    public function addons(): BelongsToMany
    {
        return $this->belongsToMany(ProductAddon::class, 'product_addon_products')
            ->withTimestamps()
            ->latest();
    }

    public function serverPackages(): HasMany
    {
        return $this->hasMany(ServerPackage::class)->orderBy('panel_package_name');
    }

    public static function provisioningModules(): array
    {
        return [
            self::MODULE_CPANEL,
            self::MODULE_PLESK,
            self::MODULE_DIRECTADMIN,
            self::MODULE_CUSTOM,
        ];
    }

    public static function paymentTypes(): array
    {
        return [
            self::PAYMENT_TYPE_FREE,
            self::PAYMENT_TYPE_ONE_TIME,
            self::PAYMENT_TYPE_RECURRING,
        ];
    }

    public static function quantityModes(): array
    {
        return [
            self::MULTIPLE_QUANTITIES_NO,
            self::MULTIPLE_QUANTITIES_MULTIPLE_SERVICES,
            self::MULTIPLE_QUANTITIES_SCALABLE,
        ];
    }
}
