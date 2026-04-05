<?php

namespace App\Http\Resources\Auth;

use App\Models\User;
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
            'tenant_id' => $this->tenant_id,
            'name' => $this->name,
            'email' => $this->email,
            'locale' => $this->locale,
            'is_active' => $this->is_active,
            'last_login_at' => $this->last_login_at,
            'tenant' => $this->when($this->tenant, [
                'id' => $this->tenant?->id,
                'name' => $this->tenant?->name,
                'slug' => $this->tenant?->slug,
                'status' => $this->tenant?->status,
                'default_locale' => $this->tenant?->default_locale,
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
