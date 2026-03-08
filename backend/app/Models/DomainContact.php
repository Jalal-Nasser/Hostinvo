<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DomainContact extends Model
{
    use HasFactory;
    use TenantAware;

    // BIGSERIAL PK — explicit declarations match the project pattern.
    public $incrementing = true;

    protected $keyType = 'int';

    public const TYPE_REGISTRANT = 'registrant';
    public const TYPE_ADMIN = 'admin';
    public const TYPE_TECH = 'tech';
    public const TYPE_BILLING = 'billing';

    protected $fillable = [
        'tenant_id',
        'domain_id',
        'type',
        'first_name',
        'last_name',
        'email',
        'phone',
        'address',
    ];

    protected function casts(): array
    {
        return [
            'address' => 'array',
        ];
    }

    public static function types(): array
    {
        return [
            self::TYPE_REGISTRANT,
            self::TYPE_ADMIN,
            self::TYPE_TECH,
            self::TYPE_BILLING,
        ];
    }

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }
}
