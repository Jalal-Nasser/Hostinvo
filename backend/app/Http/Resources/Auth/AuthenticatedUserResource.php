<?php

namespace App\Http\Resources\Auth;

use App\Models\Tenant;
use App\Models\User;
use App\Services\Tenancy\TenantContextService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthenticatedUserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $this->resource->loadMissing(['tenant', 'roles.permissions']);
        $activeTenantId = $request->hasSession()
            ? $request->session()->get(TenantContextService::ACTIVE_TENANT_SESSION_KEY)
            : null;
        $activeTenant = is_string($activeTenantId) && $activeTenantId !== ''
            ? Tenant::query()->find($activeTenantId)
            : null;
        $tenant = $activeTenant ?? $this->tenant;
        $impersonatorId = $request->session()->get('impersonator_id');
        $impersonator = null;

        if ($impersonatorId) {
            $impersonatorModel = User::query()->find($impersonatorId);

            if ($impersonatorModel) {
                $impersonator = [
                    'id' => $impersonatorModel->id,
                    'name' => $impersonatorModel->name,
                    'email' => $impersonatorModel->email,
                ];
            }
        }

        return [
            'id' => $this->id,
            'tenant_id' => $activeTenant?->getKey() ?? $this->tenant_id,
            'name' => $this->name,
            'email' => $this->email,
            'locale' => $this->locale,
            'is_active' => $this->is_active,
            'last_login_at' => $this->last_login_at,
            'tenant' => $this->when($tenant, [
                'id' => $tenant?->id,
                'name' => $tenant?->name,
                'slug' => $tenant?->slug,
                'status' => $tenant?->status,
                'default_locale' => $tenant?->default_locale,
            ]),
            'active_tenant' => $this->when($activeTenant, [
                'id' => $activeTenant?->id,
                'name' => $activeTenant?->name,
                'slug' => $activeTenant?->slug,
                'status' => $activeTenant?->status,
                'default_locale' => $activeTenant?->default_locale,
            ]),
            'roles' => $this->roles->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'display_name' => $role->display_name,
            ]),
            'permissions' => $this->permissions()->map(fn ($permission) => [
                'id' => $permission->id,
                'name' => $permission->name,
                'display_name' => $permission->display_name,
            ]),
            'impersonation' => [
                'active' => (bool) $impersonatorId,
                'impersonator' => $impersonator,
                'started_at' => $request->session()->get('impersonation_started_at'),
            ],
        ];
    }
}
