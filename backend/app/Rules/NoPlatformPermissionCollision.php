<?php

namespace App\Rules;

use App\Models\Permission;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Str;

class NoPlatformPermissionCollision implements ValidationRule
{
    public function __construct(
        private readonly ?string $tenantId,
        private readonly string $guardName = 'web',
        private readonly ?int $ignorePermissionId = null,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (blank($this->tenantId)) {
            return;
        }

        $query = Permission::query()
            ->whereNull('tenant_id')
            ->where('guard_name', $this->guardName)
            ->whereRaw('LOWER(name) = ?', [Str::lower(trim((string) $value))]);

        if ($this->ignorePermissionId) {
            $query->where('id', '!=', $this->ignorePermissionId);
        }

        if ($query->exists()) {
            $fail(__('auth.platform_permission_collision'));
        }
    }
}
