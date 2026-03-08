<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Model as EloquentModel;

class AuditLogger
{
    public function log(
        string $tenantId,
        string $action,
        EloquentModel $model,
        ?User $user = null,
        ?Request $request = null,
        ?array $before = null,
        ?array $after = null,
    ): AuditLog {
        return AuditLog::query()->create([
            'tenant_id' => $tenantId,
            'user_id' => $user?->getKey(),
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'action' => $action,
            'model_type' => $model::class,
            'model_id' => (string) $model->getKey(),
            'before' => $before,
            'after' => $after,
            'created_at' => now(),
        ]);
    }
}
