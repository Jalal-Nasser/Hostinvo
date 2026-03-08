<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConfigurableOptionChoice extends Model
{
    use HasFactory;
    use TenantAware;

    protected $table = 'configurable_option_values';

    protected $fillable = [
        'tenant_id',
        'option_id',
        'configurable_option_id',
        'label',
        'value',
        'price_modifier',
        'is_default',
        'display_order',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price_modifier' => 'integer',
            'is_default' => 'boolean',
            'display_order' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function option(): BelongsTo
    {
        return $this->belongsTo(ConfigurableOption::class, 'option_id');
    }

    public function getConfigurableOptionIdAttribute(): ?int
    {
        return isset($this->attributes['option_id'])
            ? (int) $this->attributes['option_id']
            : null;
    }

    public function setConfigurableOptionIdAttribute(mixed $value): void
    {
        $this->attributes['option_id'] = filled($value)
            ? (int) $value
            : null;
    }
}
