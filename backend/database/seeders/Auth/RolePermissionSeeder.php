<?php

namespace Database\Seeders\Auth;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            'dashboard.view' => ['Dashboard View', 'Access the authenticated dashboard.'],
            'tenant.view' => ['Tenant View', 'View tenant profile and tenant-scoped configuration.'],
            'tenant.manage' => ['Tenant Manage', 'Update tenant-level settings and administration preferences.'],
            'users.view' => ['Users View', 'View tenant users and membership data.'],
            'users.manage' => ['Users Manage', 'Create and update tenant users.'],
            'roles.view' => ['Roles View', 'View role and permission assignments.'],
            'roles.manage' => ['Roles Manage', 'Manage role assignments for tenant users.'],
            'support.access' => ['Support Access', 'Access support-focused dashboard areas.'],
            'billing.access' => ['Billing Access', 'Access billing-focused dashboard areas.'],
            'client.portal.access' => ['Client Portal Access', 'Access client-facing authenticated portal areas.'],
        ];

        foreach ($permissions as $name => [$displayName, $description]) {
            Permission::query()->updateOrCreate(
                ['name' => $name],
                [
                    'display_name' => $displayName,
                    'description' => $description,
                ]
            );
        }

        $roleMap = [
            Role::SUPER_ADMIN => array_keys($permissions),
            Role::TENANT_OWNER => [
                'dashboard.view',
                'tenant.view',
                'tenant.manage',
                'users.view',
                'users.manage',
                'roles.view',
                'roles.manage',
                'client.portal.access',
            ],
            Role::TENANT_ADMIN => [
                'dashboard.view',
                'tenant.view',
                'users.view',
                'users.manage',
                'roles.view',
                'client.portal.access',
            ],
            Role::SUPPORT_AGENT => [
                'dashboard.view',
                'support.access',
                'client.portal.access',
            ],
            Role::BILLING_MANAGER => [
                'dashboard.view',
                'billing.access',
                'client.portal.access',
            ],
            Role::CLIENT_USER => [
                'client.portal.access',
            ],
        ];

        foreach ($roleMap as $roleName => $permissionNames) {
            $role = Role::query()->updateOrCreate(
                ['name' => $roleName],
                [
                    'display_name' => str($roleName)->replace('_', ' ')->title()->toString(),
                    'description' => 'Seeded Hostinvo foundation role.',
                    'is_system' => true,
                ]
            );

            $permissionIds = Permission::query()
                ->whereIn('name', $permissionNames)
                ->pluck('id');

            $role->permissions()->sync($permissionIds);
        }
    }
}
