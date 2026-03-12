<?php

namespace Database\Seeders\Beta;

use Database\Seeders\Auth\RolePermissionSeeder;
use Illuminate\Database\Seeder;

class BetaFixtureSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            BetaTenantSeeder::class,
            BetaClientSeeder::class,
            BetaCatalogSeeder::class,
            BetaProvisioningSeeder::class,
        ]);
    }
}

