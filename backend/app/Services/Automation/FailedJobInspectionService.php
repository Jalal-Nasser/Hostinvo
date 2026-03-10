<?php

namespace App\Services\Automation;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class FailedJobInspectionService
{
    public function listForTenant(string $tenantId, int $limit = 100): Collection
    {
        return DB::table(config('queue.failed.table', 'failed_jobs'))
            ->where('tenant_id', $tenantId)
            ->orderByDesc('id')
            ->limit($limit)
            ->get();
    }

    public function findForTenant(string $tenantId, string $uuid): ?object
    {
        return DB::table(config('queue.failed.table', 'failed_jobs'))
            ->where('tenant_id', $tenantId)
            ->where('uuid', $uuid)
            ->first();
    }
}
