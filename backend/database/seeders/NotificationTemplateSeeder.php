<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Services\Notifications\NotificationEventCatalog;
use App\Services\Notifications\NotificationTemplateService;
use Illuminate\Database\Seeder;

class NotificationTemplateSeeder extends Seeder
{
    public function run(): void
    {
        /** @var NotificationTemplateService $templates */
        $templates = app(NotificationTemplateService::class);

        $templates->ensureDefaults(null, NotificationEventCatalog::SCOPE_PLATFORM);

        Tenant::query()
            ->cursor()
            ->each(function (Tenant $tenant) use ($templates): void {
                $templates->ensureDefaults($tenant, NotificationEventCatalog::SCOPE_TENANT);
            });

        $this->command?->info('NotificationTemplateSeeder: ensured platform and tenant template defaults.');
    }
}
