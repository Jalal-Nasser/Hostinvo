<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TenantSetting extends Model
{
    use HasFactory;
    use TenantAware;

    protected $guarded = [
        'tenant_id',
        'setting_key',
        'key',
        'setting_value',
        'value',
        'is_encrypted',
    ];

    protected function casts(): array
    {
        return [
            'is_encrypted' => 'boolean',
        ];
    }

    protected function settingKey(): Attribute
    {
        return Attribute::make(
            get: fn (): string => (string) ($this->attributes['key'] ?? ''),
            set: fn (mixed $value): string => trim((string) $value),
        );
    }

    protected function settingValue(): Attribute
    {
        return Attribute::make(
            get: fn (): ?string => $this->attributes['value'] ?? null,
            set: fn (mixed $value): ?string => $value === null ? null : (string) $value,
        );
    }
}
