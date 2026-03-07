<?php

namespace App\Models\Scopes;

use App\Models\Tenant;
use App\Support\Tenancy\CurrentTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $currentTenant = app(CurrentTenant::class);

        if ($model instanceof Tenant || ! $currentTenant->resolved()) {
            return;
        }

        $builder->where($model->qualifyColumn('tenant_id'), $currentTenant->id());
    }
}
