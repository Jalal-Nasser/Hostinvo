<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tax extends Model
{
    use HasFactory;
    use TenantAware;

    protected $fillable = [
        'tenant_id',
        'name',
        'rate',
        'country',
        'state',
    ];

    protected function casts(): array
    {
        return [
            'rate' => 'integer',
        ];
    }
}
