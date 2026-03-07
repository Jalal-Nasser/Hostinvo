<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use HasFactory;

    public const SUPER_ADMIN = 'super_admin';
    public const TENANT_OWNER = 'tenant_owner';
    public const TENANT_ADMIN = 'tenant_admin';
    public const SUPPORT_AGENT = 'support_agent';
    public const BILLING_MANAGER = 'billing_manager';
    public const CLIENT_USER = 'client_user';

    protected $fillable = [
        'name',
        'display_name',
        'description',
        'is_system',
    ];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
        ];
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class)->withTimestamps();
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    public function tenantUsers(): HasMany
    {
        return $this->hasMany(TenantUser::class);
    }
}
