<?php

namespace App\Http\Resources\Tenancy;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'plan' => $this->plan,
            'status' => $this->status,
            'owner_user_id' => $this->owner_user_id,
            'primary_domain' => $this->primary_domain,
            'default_locale' => $this->default_locale,
            'default_currency' => $this->default_currency,
            'timezone' => $this->timezone,
            'users_count' => $this->whenCounted('users'),
            'owner' => $this->whenLoaded('owner', function () {
                if (! $this->owner) {
                    return null;
                }

                return [
                    'id' => $this->owner->id,
                    'name' => $this->owner->name,
                    'email' => $this->owner->email,
                    'locale' => $this->owner->locale,
                    'is_active' => $this->owner->is_active,
                    'last_login_at' => optional($this->owner->last_login_at)?->toIso8601String(),
                ];
            }),
            'license_summary' => $this->whenLoaded('latestLicense', function () {
                if (! $this->latestLicense) {
                    return null;
                }

                return [
                    'id' => $this->latestLicense->id,
                    'license_key' => $this->latestLicense->license_key,
                    'plan' => $this->latestLicense->effectivePlan(),
                    'status' => $this->latestLicense->status,
                    'domain' => $this->latestLicense->domain,
                    'max_clients' => $this->latestLicense->max_clients,
                    'max_services' => $this->latestLicense->max_services,
                    'issued_at' => optional($this->latestLicense->issued_at)?->toIso8601String(),
                    'expires_at' => optional($this->latestLicense->expires_at)?->toIso8601String(),
                    'last_verified_at' => optional($this->latestLicense->last_verified_at)?->toIso8601String(),
                    'is_trial' => $this->latestLicense->isTrial(),
                ];
            }),
            'members' => $this->whenLoaded('tenantUsers', fn () => $this->tenantUsers->map(function ($membership) {
                return [
                    'id' => $membership->id,
                    'role' => $membership->role ? [
                        'id' => $membership->role->id,
                        'name' => $membership->role->name,
                        'display_name' => $membership->role->display_name,
                    ] : null,
                    'user' => $membership->relationLoaded('user') && $membership->user ? [
                        'id' => $membership->user->id,
                        'name' => $membership->user->name,
                        'email' => $membership->user->email,
                    ] : null,
                    'is_primary' => (bool) $membership->is_primary,
                    'joined_at' => optional($membership->joined_at)?->toIso8601String(),
                ];
            })),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
            'deleted_at' => optional($this->deleted_at)?->toIso8601String(),
        ];
    }
}
