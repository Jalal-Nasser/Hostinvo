<?php

namespace App\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TicketDepartment extends Model
{
    use HasFactory;
    use SoftDeletes;
    use TenantAware;

    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'slug',
        'description',
        'is_active',
        'is_default',
        'display_order',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'display_order' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public static function defaultCatalog(): array
    {
        return [
            [
                'name' => 'General Support',
                'description' => 'General account, portal, and service inquiries.',
                'is_active' => true,
                'display_order' => 10,
            ],
            [
                'name' => 'Technical Support',
                'description' => 'Hosting, DNS, control-panel, and infrastructure issues.',
                'is_active' => true,
                'display_order' => 20,
            ],
            [
                'name' => 'Billing',
                'description' => 'Invoice, payment, credit, and refund questions.',
                'is_active' => true,
                'display_order' => 30,
            ],
        ];
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'department_id')->latest();
    }
}
