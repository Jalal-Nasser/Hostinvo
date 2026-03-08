<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TenantSetting extends Model
{
    use HasFactory;
    use HasUuids;
    use TenantAware;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id',
        'setting_key',
        'setting_value',
        'is_encrypted',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'is_encrypted' => 'boolean',
            'metadata' => 'array',
        ];
    }
}
