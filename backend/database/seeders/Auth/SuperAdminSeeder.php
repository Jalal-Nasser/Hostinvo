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
        $user = User::query()->updateOrCreate(
            ['email' => env('SUPER_ADMIN_EMAIL', 'admin@hostinvo.test')],
            [
                'tenant_id' => null,
                'name' => env('SUPER_ADMIN_NAME', 'Hostinvo Super Admin'),
                'locale' => env('APP_LOCALE', 'en'),
                'is_active' => true,
                'email_verified_at' => now(),
                'password' => Hash::make(env('SUPER_ADMIN_PASSWORD', 'ChangeMe123!')),
            ]
        );

        $user->roles()->sync([
            Role::query()->where('name', Role::SUPER_ADMIN)->value('id'),
        ]);
    }
}
