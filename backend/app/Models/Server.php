<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Crypt;
use Throwable;

class Server extends Model
{
    use HasFactory;
    use SoftDeletes;
    use TenantAware;

    public const PANEL_CPANEL = 'cpanel';
    public const PANEL_PLESK = 'plesk';

    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_MAINTENANCE = 'maintenance';

    protected $fillable = [
        'server_group_id',
        'name',
        'hostname',
        'panel_type',
        'api_endpoint',
        'api_port',
        'status',
        'verify_ssl',
        'ssl_verify',
        'max_accounts',
        'username',
        'ip_address',
        'notes',
    ];

    protected $guarded = [
        'tenant_id',
        'api_token',
        'api_secret',
        'credentials',
        'current_accounts',
        'account_count',
        'last_tested_at',
    ];

    protected $hidden = [
        'api_token',
        'api_secret',
    ];

    protected function casts(): array
    {
        return [
            'api_port' => 'integer',
            'ssl_verify' => 'boolean',
            'max_accounts' => 'integer',
            'account_count' => 'integer',
            'last_tested_at' => 'datetime',
        ];
    }

    public function getCurrentAccountsAttribute(): int
    {
        return (int) ($this->attributes['account_count'] ?? 0);
    }

    public function setCurrentAccountsAttribute(mixed $value): void
    {
        $this->attributes['account_count'] = max(0, (int) $value);
    }

    public function getVerifySslAttribute(): bool
    {
        return (bool) ($this->attributes['ssl_verify'] ?? true);
    }

    public function setVerifySslAttribute(mixed $value): void
    {
        $this->attributes['ssl_verify'] = (bool) $value;
    }

    protected function credentials(): Attribute
    {
        return Attribute::make(
            get: fn (): array => array_filter([
                'username' => $this->username,
                'api_token' => $this->decryptSecret($this->attributes['api_token'] ?? null),
                'api_key' => $this->panel_type === self::PANEL_PLESK
                    ? $this->decryptSecret($this->attributes['api_token'] ?? null)
                    : null,
                'api_secret' => $this->decryptSecret($this->attributes['api_secret'] ?? null),
            ], static fn (mixed $value): bool => filled($value)),
            set: function (mixed $value, array $attributes): array {
                $credentials = (array) $value;
                $token = $credentials['api_token'] ?? $credentials['api_key'] ?? null;

                return [
                    'username' => $credentials['username'] ?? ($attributes['username'] ?? null),
                    'api_token' => $this->encryptSecret($token),
                    'api_secret' => $this->encryptSecret($credentials['api_secret'] ?? null),
                ];
            },
        );
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

    private function encryptSecret(mixed $value): ?string
    {
        if (blank($value)) {
            return null;
        }

        return Crypt::encryptString((string) $value);
    }

    private function decryptSecret(?string $value): ?string
    {
        if (blank($value)) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (Throwable) {
            return null;
        }
    }
}
