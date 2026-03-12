<?php

namespace App\Console\Commands;

use App\Services\System\BetaValidationService;
use Database\Seeders\Beta\BetaFixtureSeeder;
use Illuminate\Console\Command;
use Throwable;

class HostinvoBetaValidateCommand extends Command
{
    protected $signature = 'hostinvo:beta-validate
        {--seed : Seed staging beta fixtures before running checks}
        {--json : Output the validation report as JSON}';

    protected $description = 'Run staging beta environment validation checks for Hostinvo.';

    public function __construct(
        private readonly BetaValidationService $betaValidation,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        if (! app()->environment(['staging', 'local', 'testing'])) {
            $this->error('hostinvo:beta-validate is restricted to staging, local, or testing environments.');

            return self::FAILURE;
        }

        if ($this->option('seed')) {
            $this->line('Seeding beta fixtures...');

            $seedExitCode = $this->call('db:seed', [
                '--class' => BetaFixtureSeeder::class,
                '--force' => true,
            ]);

            if ($seedExitCode !== self::SUCCESS) {
                $this->error('Beta fixture seeding failed.');

                return self::FAILURE;
            }
        }

        $system = $this->betaValidation->runSystemChecks();
        $simulations = [
            'simulate_provisioning' => $this->runSimulation('provisioning', fn (): array => $this->betaValidation->simulateProvisioning()),
            'simulate_billing_cycle' => $this->runSimulation('billing cycle', fn (): array => $this->betaValidation->simulateBillingCycle()),
            'simulate_webhook_processing' => $this->runSimulation('webhook processing', fn (): array => $this->betaValidation->simulateWebhookProcessing()),
        ];

        $overallStatus = $this->aggregateStatus($system, $simulations);
        $report = [
            'status' => $overallStatus,
            'environment' => app()->environment(),
            'system_checks' => $system,
            'simulations' => $simulations,
            'timestamp' => now()->toIso8601String(),
        ];

        if ($this->option('json')) {
            $this->line(json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } else {
            $this->renderTable($system, $simulations);
        }

        if ($overallStatus === 'ok') {
            $this->info('Beta validation completed successfully.');

            return self::SUCCESS;
        }

        $this->error('Beta validation failed. Resolve reported checks before opening controlled beta access.');

        return self::FAILURE;
    }

    /**
     * @param  array<string, array{status:string, message?:string}>  $simulations
     */
    private function renderTable(array $system, array $simulations): void
    {
        $rows = [];

        foreach ($system['checks'] as $checkName => $payload) {
            $rows[] = [
                'Check' => $checkName,
                'Status' => strtoupper((string) ($payload['status'] ?? 'fail')),
                'Message' => (string) ($payload['message'] ?? ''),
            ];
        }

        foreach ($simulations as $checkName => $payload) {
            $rows[] = [
                'Check' => $checkName,
                'Status' => strtoupper((string) ($payload['status'] ?? 'fail')),
                'Message' => (string) ($payload['message'] ?? ''),
            ];
        }

        $this->info('Hostinvo Beta Validation');
        $this->line(sprintf('Environment: %s', app()->environment()));
        $this->line(sprintf('Timestamp: %s', now()->toIso8601String()));
        $this->newLine();
        $this->table(['Check', 'Status', 'Message'], $rows);
    }

    /**
     * @param  array<string, array{status:string, message?:string}>  $simulations
     */
    private function aggregateStatus(array $system, array $simulations): string
    {
        $statuses = [];
        $statuses[] = (string) ($system['status'] ?? 'fail');

        foreach ($simulations as $simulation) {
            $statuses[] = (string) ($simulation['status'] ?? 'fail');
        }

        if (in_array('fail', $statuses, true)) {
            return 'fail';
        }

        if (in_array('degraded', $statuses, true)) {
            return 'fail';
        }

        if (in_array('skipped', $statuses, true)) {
            return 'fail';
        }

        return 'ok';
    }

    /**
     * @param  callable(): array  $callback
     * @return array{status:string, message:string}
     */
    private function runSimulation(string $name, callable $callback): array
    {
        try {
            return $callback();
        } catch (Throwable $exception) {
            return [
                'status' => 'fail',
                'message' => sprintf('Unhandled exception during %s simulation: %s', $name, $exception->getMessage()),
            ];
        }
    }
}
