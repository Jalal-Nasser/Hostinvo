<?php

namespace App\Models;

use App\Rules\NoPlatformPermissionCollision;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class Permission extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'guard_name',
        'display_name',
        'description',
    ];

    protected $guarded = [
        'tenant_id',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $permission): void {
            $permission->name = Str::lower(trim($permission->name));
            $permission->guard_name = trim($permission->guard_name ?: 'web');

            Validator::make(
                [
                    'name' => $permission->name,
                ],
                [
                    'name' => [
                        'required',
                        'string',
                        new NoPlatformPermissionCollision(
                            tenantId: $permission->tenant_id,
                            guardName: $permission->guard_name,
                            ignorePermissionId: $permission->exists ? (int) $permission->getKey() : null,
                        ),
                    ],
                ],
            )->validate();
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)->withTimestamps();
    }
}
