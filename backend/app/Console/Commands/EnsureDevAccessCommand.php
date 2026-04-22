<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\Scopes\TenantScope;
use App\Models\User;
use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class EnsureDevAccessCommand extends Command
{
    protected $signature = 'hostinvo:ensure-dev-access
        {--email= : Super admin email address}
        {--password= : Password to set for a new super admin}
        {--name= : Super admin display name}
        {--reset-password : Reset the password even if the super admin already exists}';

    protected $description = 'Create or repair development super-admin access without wiping application data.';

    public function handle(): int
    {
        app(RolePermissionSeeder::class)->run();

        $email = (string) ($this->option('email') ?: env('SUPER_ADMIN_EMAIL', 'admin@hostinvo.dev'));
        $password = (string) ($this->option('password') ?: env('SUPER_ADMIN_PASSWORD', 'ChangeMe123!'));
        $name = (string) ($this->option('name') ?: env('SUPER_ADMIN_NAME', 'Hostinvo Super Admin'));

        $user = User::query()
            ->withoutGlobalScope(TenantScope::class)
            ->whereNull('tenant_id')
            ->where('email', $email)
            ->first() ?? new User();

        $attributes = [
            'tenant_id' => null,
            'email' => $email,
            'name' => $name,
            'locale' => env('APP_LOCALE', 'en'),
            'is_active' => true,
            'email_verification_required' => false,
            'email_verified_at' => $user->email_verified_at ?? now(),
        ];

        if (! $user->exists || (bool) $this->option('reset-password')) {
            $attributes['password'] = Hash::make($password);
        }

        $user->forceFill($attributes)->save();

        $role = Role::query()->where('name', Role::SUPER_ADMIN)->firstOrFail();
        $user->roles()->syncWithoutDetaching([$role->id]);

        $this->info('Development super admin is ready.');
        $this->line("Email: {$email}");

        if (! $user->wasRecentlyCreated && ! (bool) $this->option('reset-password')) {
            $this->line('Password: unchanged');
        } else {
            $this->line("Password: {$password}");
        }

        return self::SUCCESS;
    }
}
