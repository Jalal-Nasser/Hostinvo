<?php

namespace App\Console\Commands;

use App\Models\Server;
use App\Services\Provisioning\PleskServiceSyncService;
use Illuminate\Console\Command;
use Throwable;

class PleskSyncServicesCommand extends Command
{
    protected $signature = 'plesk:sync-services {--server= : Plesk server id}';

    protected $description = 'Link imported WHMCS services to existing Plesk subscriptions without creating accounts.';

    public function handle(PleskServiceSyncService $sync): int
    {
        $serverId = trim((string) $this->option('server'));

        if ($serverId === '') {
            $this->error('Missing server. Pass --server=ID.');

            return self::FAILURE;
        }

        $server = Server::query()->withoutGlobalScopes()->find($serverId);

        if (! $server) {
            $this->error("Server not found for '{$serverId}'.");

            return self::FAILURE;
        }

        try {
            $summary = $sync->sync($server);
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info(sprintf('Plesk service sync completed for server: %s (%s)', $server->name, $server->id));
        $this->table(
            ['Metric', 'Value'],
            [
                ['Subscriptions seen', $summary['subscriptions_seen']],
                ['Services scanned', $summary['services_scanned']],
                ['Matched', $summary['matched']],
                ['Updated', $summary['updated']],
                ['Unmatched', $summary['unmatched']],
            ],
        );

        return self::SUCCESS;
    }
}
