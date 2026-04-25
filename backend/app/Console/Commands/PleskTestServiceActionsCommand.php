<?php

namespace App\Console\Commands;

use App\Models\ProvisioningJob;
use App\Models\Server;
use App\Models\Service;
use App\Models\User;
use App\Services\Provisioning\ProvisioningService;
use App\Support\Tenancy\CurrentTenant;
use Illuminate\Console\Command;
use Throwable;

class PleskTestServiceActionsCommand extends Command
{
    protected $signature = 'plesk:test-service-actions {--service= : Hostinvo service id linked to a Plesk subscription}';

    protected $description = 'Run Plesk suspend, unsuspend, and terminate lifecycle actions for a linked service.';

    public function handle(ProvisioningService $provisioning): int
    {
        $serviceId = trim((string) $this->option('service'));

        if ($serviceId === '') {
            $this->error('Missing service. Pass --service=ID.');

            return self::FAILURE;
        }

        $service = Service::query()
            ->withoutGlobalScopes()
            ->with(['tenant', 'server', 'owner'])
            ->find($serviceId);

        if (! $service) {
            $this->error("Service not found for '{$serviceId}'.");

            return self::FAILURE;
        }

        if ($service->server?->panel_type !== Server::PANEL_PLESK) {
            $this->error('The selected service is not assigned to a Plesk server.');

            return self::FAILURE;
        }

        if (! filled($service->external_id)) {
            $this->error('The selected service does not have a Plesk subscription external_id.');

            return self::FAILURE;
        }

        $actor = $service->owner ?: User::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $service->tenant_id)
            ->oldest()
            ->first();

        if (! $actor) {
            $this->error('No tenant user is available to own the test provisioning jobs.');

            return self::FAILURE;
        }

        app(CurrentTenant::class)->set($service->tenant);

        $operations = [
            ProvisioningJob::OPERATION_SUSPEND_ACCOUNT,
            ProvisioningJob::OPERATION_UNSUSPEND_ACCOUNT,
            ProvisioningJob::OPERATION_TERMINATE_ACCOUNT,
        ];

        $this->warn('This command will DELETE the Plesk subscription during the terminate step.');
        $this->info(sprintf('Testing Plesk service actions for service %s using subscription id %s.', $service->id, $service->external_id));

        try {
            foreach ($operations as $operation) {
                $this->line("Running {$operation}...");

                $job = $provisioning->dispatchOperation(
                    service: $service->fresh(['server', 'tenant', 'owner']) ?? $service,
                    operation: $operation,
                    actor: $actor,
                    payload: [],
                );

                $provisioning->processQueuedJob($job->id);

                $job = $job->fresh();
                $service = $service->fresh(['server', 'tenant', 'owner']) ?? $service;

                if ($job?->status !== ProvisioningJob::STATUS_COMPLETED) {
                    $this->error(sprintf(
                        '%s failed: %s',
                        $operation,
                        $job?->error_message ?: 'unknown provisioning error',
                    ));

                    return self::FAILURE;
                }

                $this->info(sprintf('%s completed. Service status: %s.', $operation, $service->status));
            }
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        } finally {
            app(CurrentTenant::class)->clear();
        }

        $this->info('Plesk service action test completed.');

        return self::SUCCESS;
    }
}
