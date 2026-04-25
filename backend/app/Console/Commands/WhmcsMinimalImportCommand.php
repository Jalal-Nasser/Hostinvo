<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\Import\WhmcsMinimalImportService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class WhmcsMinimalImportCommand extends Command
{
    protected $signature = 'whmcs:import-minimal
        {--tenant= : Tenant id, slug, or primary domain to import into}
        {--connection= : Existing Laravel database connection for the WHMCS source}
        {--host= : WHMCS database host}
        {--port=3306 : WHMCS database port}
        {--database= : WHMCS database name}
        {--username= : WHMCS database username}
        {--password= : WHMCS database password}
        {--charset=utf8mb4 : WHMCS database charset}
        {--table-prefix=tbl : WHMCS table prefix}';

    protected $description = 'Import minimal WHMCS clients, product groups, products, and services into one tenant.';

    public function handle(WhmcsMinimalImportService $importer): int
    {
        try {
            $tenant = $this->resolveTenant();
            $connection = $this->option('connection');
            $prefix = (string) ($this->option('table-prefix') ?: 'tbl');
            $summary = filled($connection)
                ? $importer->import($tenant, (string) $connection, $prefix)
                : $importer->importFromCredentials($tenant, $this->sourceCredentials($prefix));
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info(sprintf('WHMCS minimal import completed for tenant: %s (%s)', $tenant->name, $tenant->id));
        $this->table(
            ['Entity', 'Created', 'Updated', 'Extra'],
            [
                ['Clients', $summary['clients']['created'], $summary['clients']['updated'], ''],
                ['Product groups', $summary['product_groups']['created'], $summary['product_groups']['updated'], ''],
                [
                    'Products',
                    $summary['products']['created'],
                    $summary['products']['updated'],
                    sprintf(
                        'placeholders: %d, default pricing: %d',
                        $summary['products']['placeholder_created'],
                        $summary['products']['default_pricing_created'],
                    ),
                ],
                ['Services', $summary['services']['created'], $summary['services']['updated'], sprintf('skipped: %d', $summary['services']['skipped'])],
            ],
        );

        if ($summary['missing_relations'] !== []) {
            $this->warn('Missing relations / import warnings:');

            foreach ($summary['missing_relations'] as $warning) {
                $this->line("- {$warning}");
            }
        }

        return self::SUCCESS;
    }

    private function resolveTenant(): Tenant
    {
        $value = trim((string) ($this->option('tenant') ?: env('WHMCS_IMPORT_TENANT', '')));

        if ($value === '') {
            throw new RuntimeException('Missing tenant. Pass --tenant=ID_OR_SLUG or set WHMCS_IMPORT_TENANT.');
        }

        $tenant = Tenant::query()
            ->when(
                Str::isUuid($value),
                fn ($query) => $query->where('id', $value),
                fn ($query) => $query->where('slug', $value)->orWhere('primary_domain', $value),
            )
            ->first();

        if (! $tenant) {
            throw new RuntimeException("Tenant not found for '{$value}'.");
        }

        return $tenant;
    }

    private function sourceCredentials(string $prefix): array
    {
        return [
            'host' => (string) ($this->option('host') ?: env('WHMCS_DB_HOST', '')),
            'port' => (string) ($this->option('port') ?: env('WHMCS_DB_PORT', '3306')),
            'database' => (string) ($this->option('database') ?: env('WHMCS_DB_DATABASE', '')),
            'username' => (string) ($this->option('username') ?: env('WHMCS_DB_USERNAME', '')),
            'password' => (string) ($this->option('password') ?: env('WHMCS_DB_PASSWORD', '')),
            'charset' => (string) ($this->option('charset') ?: env('WHMCS_DB_CHARSET', 'utf8mb4')),
            'table_prefix' => $prefix,
        ];
    }
}
