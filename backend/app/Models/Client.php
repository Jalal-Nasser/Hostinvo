<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;
    use TenantAware;

    public const TYPE_COMPANY = 'company';
    public const TYPE_INDIVIDUAL = 'individual';

    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_LEAD = 'lead';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'client_type',
        'first_name',
        'last_name',
        'company_name',
        'email',
        'phone',
        'country',
        'status',
        'preferred_locale',
        'currency',
        'notes',
    ];

    protected function displayName(): Attribute
    {
        return Attribute::make(
            get: function (): string {
                if (filled($this->company_name)) {
                    return $this->company_name;
                }

                $fullName = trim(sprintf('%s %s', $this->first_name, $this->last_name));

                return $fullName !== '' ? $fullName : $this->email;
            }
        );
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(ClientContact::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(ClientAddress::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ClientActivityLog::class)->latest();
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class)->latest();
    }
}
