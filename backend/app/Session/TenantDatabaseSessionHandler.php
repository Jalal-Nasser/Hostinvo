<?php

namespace App\Session;

use App\Support\Tenancy\CurrentTenant;
use Illuminate\Session\DatabaseSessionHandler;

class TenantDatabaseSessionHandler extends DatabaseSessionHandler
{
    protected function addUserInformation(&$payload)
    {
        parent::addUserInformation($payload);

        $tenantId = null;

        if ($this->container?->bound('request')) {
            $request = $this->container->make('request');
            $tenantId = $request->user()?->tenant_id ?? $request->session()->get('tenant_id');
        }

        if (! $tenantId && $this->container?->bound(CurrentTenant::class)) {
            $tenantId = $this->container->make(CurrentTenant::class)->id();
        }

        $payload['tenant_id'] = $tenantId;

        return $this;
    }
}
