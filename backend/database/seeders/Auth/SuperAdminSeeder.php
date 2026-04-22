<?php

namespace Database\Seeders\Auth;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::query()
            ->whereNull('tenant_id')
            ->where('email', env('SUPER_ADMIN_EMAIL', 'admin@hostinvo.dev'))
            ->first() ?? new User();

        $attributes = [
            'tenant_id' => null,
            'email' => env('SUPER_ADMIN_EMAIL', 'admin@hostinvo.dev'),
            'name' => env('SUPER_ADMIN_NAME', 'Hostinvo Super Admin'),
            'locale' => env('APP_LOCALE', 'en'),
            'is_active' => true,
            'email_verified_at' => now(),
        ];

        if (! $user->exists || filter_var(env('SUPER_ADMIN_RESET_PASSWORD', false), FILTER_VALIDATE_BOOL)) {
            $attributes['password'] = Hash::make(env('SUPER_ADMIN_PASSWORD', 'ChangeMe123!'));
        }

        $user->forceFill($attributes)->save();

        $user->roles()->sync([
            Role::query()->where('name', Role::SUPER_ADMIN)->value('id'),
        ]);
    }
}
