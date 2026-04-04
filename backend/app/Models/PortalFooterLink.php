<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PortalFooterLink extends Model
{
    use HasFactory;
    use HasUuids;
    use TenantAware;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id',
        'group_key',
        'label_en',
        'label_ar',
        'href',
        'is_visible',
        'open_in_new_tab',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_visible' => 'boolean',
            'open_in_new_tab' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
