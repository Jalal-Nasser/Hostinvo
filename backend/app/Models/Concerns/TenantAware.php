<?php

namespace App\Models\Concerns;

use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Support\Tenancy\CurrentTenant;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait TenantAware
{
    public static function bootTenantAware(): void
    {
        static::addGlobalScope(new TenantScope());

        static::creating(function ($model): void {
            $currentTenant = app(CurrentTenant::class);

            if (! $model->tenant_id && $currentTenant->resolved()) {
                $model->tenant_id = $currentTenant->id();
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
