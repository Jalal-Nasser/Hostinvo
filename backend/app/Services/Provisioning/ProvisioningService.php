<?php

namespace App\Services\Provisioning;

use App\Contracts\Repositories\Auth\UserRepositoryInterface;
use App\Contracts\Repositories\Catalog\ProductRepositoryInterface;
use App\Contracts\Repositories\Clients\ClientRepositoryInterface;
use App\Contracts\Repositories\Orders\OrderRepositoryInterface;
use App\Contracts\Repositories\Provisioning\ProvisioningJobRepositoryInterface;
use App\Contracts\Repositories\Provisioning\ServerRepositoryInterface;
use App\Contracts\Repositories\Provisioning\ServiceRepositoryInterface;
use App\Models\ProvisioningJob;
use App\Models\ProvisioningLog;
use App\Models\Server;
use App\Models\Service;
use App\Models\ServiceSuspension;
use App\Models\User;
use App\Provisioning\Data\ProvisioningContext;
use App\Provisioning\Exceptions\ProvisioningException;
use App\Provisioning\ProvisioningDriverManager;
use App\Provisioning\ProvisioningJobDispatcher;
use App\Provisioning\ProvisioningLogger;
use App\Provisioning\ServerSelector;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class ProvisioningService
{
    public function __construct(
        private readonly ServiceRepositoryInterface $services,
        private readonly ProvisioningJobRepositoryInterface $jobs,
        private readonly ClientRepositoryInterface $clients,
        private readonly ProductRepositoryInterface $products,
        private readonly OrderRepositoryInterface $orders,
        private readonly UserRepositoryInterface $users,
        private readonly ServerRepositoryInterface $servers,
        private readonly ProvisioningDriverManager $drivers,
        private readonly ProvisioningLogger $logger,
        private readonly ProvisioningJobDispatcher $dispatcher,
        private readonly ServerSelector $serverSelector,
    ) {
    }

    public function paginateServices(array $filters): LengthAwarePaginator
    {
        return $this->services->paginate($filters);
    }

    public function getServiceForDisplay(Service $service): Service
    {
        return $this->services->findByIdForDisplay($service->getKey()) ?? $service;
    }

    public function createService(array $payload, User $actor): Service
    {
        return DB::transaction(function () use ($payload, $actor): Service {
            $attributes = $this->buildServiceAttributes($payload, $actor->tenant_id, $actor);
            $service = $this->services->create($attributes);

            $this->logger->recordServiceNote(
                $service,
                'Service record created for future asynchronous provisioning.',
                ['status' => $service->status]
            );

            return $this->getServiceForDisplay($service);
        });
    }

    public function updateService(Service $service, array $payload, User $actor): Service
    {
        return DB::transaction(function () use ($service, $payload, $actor): Service {
            $attributes = $this->buildServiceAttributes($payload, $service->tenant_id, $actor, $service);
            $this->services->update($service, $attributes);

            $this->logger->recordServiceNote(
                $service,
                'Service record updated inside the provisioning foundation.',
                ['status' => $service->status]
            );

            return $this->getServiceForDisplay($service);
        });
    }

    public function deleteService(Service $service): void
    {
        if ($service->provisioningJobs()->whereIn('status', [
            ProvisioningJob::STATUS_QUEUED,
            ProvisioningJob::STATUS_PROCESSING,
        ])->exists()) {
            throw ValidationException::withMessages([
                'service' => ['Services with active provisioning jobs cannot be archived.'],
            ]);
        }

        $this->services->delete($service);
    }

    public function paginateJobs(array $filters): LengthAwarePaginator
    {
        return $this->jobs->paginate($filters);
    }

    public function getJobForDisplay(ProvisioningJob $job): ProvisioningJob
    {
        return $this->jobs->findByIdForDisplay($job->getKey()) ?? $job;
    }

    public function dispatchOperation(Service $service, string $operation, User $actor, array $payload = []): ProvisioningJob
    {
        if (! in_array($operation, ProvisioningJob::operations(), true)) {
            throw ValidationException::withMessages([
                'operation' => ['The requested provisioning operation is invalid.'],
            ]);
        }

        return DB::transaction(function () use ($service, $operation, $actor, $payload): ProvisioningJob {
            [$server, $serverPackage] = $this->resolveTargetInfrastructure($service, $payload);

            $serviceAttributes = [
                'server_id' => $server?->id,
                'server_package_id' => $serverPackage?->id ?? $service->server_package_id,
                'last_operation' => $operation,
                'provisioning_state' => Service::PROVISIONING_QUEUED,
            ];

            if ($operation === ProvisioningJob::OPERATION_CREATE_ACCOUNT
                && in_array($service->status, [Service::STATUS_PENDING, Service::STATUS_FAILED], true)) {
                $serviceAttributes['status'] = Service::STATUS_PROVISIONING;
            }

            $this->services->update($service, $serviceAttributes);

            $job = $this->jobs->create([
                'tenant_id' => $service->tenant_id,
                'service_id' => $service->id,
                'server_id' => $server?->id,
                'requested_by_user_id' => $actor->id,
                'operation' => $operation,
                'status' => ProvisioningJob::STATUS_QUEUED,
                'driver' => $server?->panel_type,
                'queue_name' => config('provisioning.queue.name', 'critical'),
                'attempts' => 0,
                'payload' => $payload,
                'result_payload' => null,
                'error_message' => null,
                'requested_at' => now(),
            ]);

            $this->logger->recordQueued($job);
            $this->dispatcher->dispatch($job);

            return $this->getJobForDisplay($job);
        });
    }

    public function processQueuedJob(string $jobId, int $attempts = 1): void
    {
        $job = $this->jobs->findById($jobId);

        if (! $job || in_array($job->status, [ProvisioningJob::STATUS_COMPLETED, ProvisioningJob::STATUS_FAILED], true)) {
            return;
        }

        $service = $this->services->findByIdForDisplay($job->service_id);

        if (! $service) {
            throw ValidationException::withMessages([
                'service' => ['The provisioning service record could not be found.'],
            ]);
        }

        $this->jobs->update($job, [
            'status' => ProvisioningJob::STATUS_PROCESSING,
            'attempts' => max($attempts, 1),
            'started_at' => $job->started_at ?? now(),
            'error_message' => null,
        ]);

        $this->services->update($service, [
            'provisioning_state' => Service::PROVISIONING_PROCESSING,
        ]);

        $this->logger->record(
            $job,
            ProvisioningLog::STATUS_PROCESSING,
            "Provisioning job {$job->operation} is processing.",
            $job->payload ?? [],
        );

        [$server, $serverPackage] = $this->resolveTargetInfrastructure($service, $job->payload ?? []);
        $driver = $this->drivers->forServer($server);
        $context = new ProvisioningContext(
            service: $service,
            server: $server,
            serverPackage: $serverPackage,
            job: $job,
            payload: $job->payload ?? [],
        );

        try {
            $result = $this->executeDriverOperation($driver, $job->operation, $context);
        } catch (ProvisioningException $exception) {
            $this->jobs->update($job, [
                'attempts' => max($attempts, 1),
                'error_message' => $exception->getMessage(),
                'result_payload' => $exception->responsePayload() === [] ? $job->result_payload : $exception->responsePayload(),
            ]);

            $this->logger->record(
                $job,
                ProvisioningLog::STATUS_FAILED,
                $exception->getMessage(),
                $exception->requestPayload(),
                $exception->responsePayload(),
            );

            throw $exception;
        } catch (Throwable $exception) {
            $this->jobs->update($job, [
                'attempts' => max($attempts, 1),
                'error_message' => $exception->getMessage(),
            ]);

            $this->logger->record(
                $job,
                ProvisioningLog::STATUS_FAILED,
                $exception->getMessage(),
                $job->payload ?? [],
            );

            throw $exception;
        }

        if (! $result->successful) {
            $this->markQueuedJobFailed($jobId, $result->message, $result->requestPayload, $result->responsePayload, false);

            return;
        }

        DB::transaction(function () use ($job, $service, $server, $serverPackage, $result): void {
            $this->jobs->update($job, [
                'status' => ProvisioningJob::STATUS_COMPLETED,
                'server_id' => $server->id,
                'driver' => $server->panel_type,
                'result_payload' => array_merge($result->responsePayload, [
                    'message' => $result->message,
                    'status' => $result->status,
                ]),
                'completed_at' => now(),
                'failed_at' => null,
                'error_message' => null,
            ]);

            $serviceAttributes = $this->applyOperationState(
                service: $service,
                server: $server,
                serverPackage: $serverPackage,
                operation: $job->operation,
                payload: array_merge($job->payload ?? [], $result->operationPayload),
            );

            $serviceAttributes = array_merge($serviceAttributes, $result->serviceAttributes);
            $this->services->update($service, $serviceAttributes);

            $this->logger->record(
                $job,
                $result->status,
                $result->message,
                $result->requestPayload,
                $result->responsePayload,
            );
        });
    }

    public function markQueuedJobFailed(
        string $jobId,
        string $message,
        array $requestPayload = [],
        array $responsePayload = [],
        bool $shouldThrow = true
    ): void {
        $job = $this->jobs->findById($jobId);

        if (! $job) {
            if ($shouldThrow) {
                throw ValidationException::withMessages([
                    'provisioning_job' => ['The provisioning job could not be found.'],
                ]);
            }

            return;
        }

        $service = $this->services->findById($job->service_id);

        DB::transaction(function () use ($job, $service, $message, $requestPayload, $responsePayload): void {
            $this->jobs->update($job, [
                'status' => ProvisioningJob::STATUS_FAILED,
                'failed_at' => now(),
                'error_message' => $message,
                'result_payload' => $responsePayload === [] ? null : $responsePayload,
            ]);

            if ($service) {
                $attributes = [
                    'provisioning_state' => Service::PROVISIONING_FAILED,
                    'last_operation' => $job->operation,
                ];

                if ($job->operation === ProvisioningJob::OPERATION_CREATE_ACCOUNT) {
                    $attributes['status'] = Service::STATUS_FAILED;
                }

                $this->services->update($service, $attributes);
            }

            $this->logger->record(
                $job,
                ProvisioningLog::STATUS_FAILED,
                $message,
                $requestPayload,
                $responsePayload,
            );
        });
    }

    public function retryFailedJob(ProvisioningJob $job, User $actor): ProvisioningJob
    {
        if ($job->tenant_id !== $actor->tenant_id || $job->status !== ProvisioningJob::STATUS_FAILED) {
            throw ValidationException::withMessages([
                'provisioning_job' => ['Only failed provisioning jobs from the active tenant can be retried.'],
            ]);
        }

        $service = $this->services->findById($job->service_id);

        if (! $service || $service->tenant_id !== $actor->tenant_id) {
            throw ValidationException::withMessages([
                'service' => ['The provisioning service record could not be found for retry.'],
            ]);
        }

        $this->logger->record(
            $job,
            ProvisioningLog::STATUS_QUEUED,
            __('provisioning.server_connection_retry_dispatched'),
            ['retry_requested_by' => $actor->id],
        );

        return $this->dispatchOperation(
            service: $service,
            operation: $job->operation,
            actor: $actor,
            payload: $job->payload ?? [],
        );
    }

    private function buildServiceAttributes(
        array $payload,
        string $tenantId,
        User $actor,
        ?Service $service = null
    ): array {
        $client = $this->clients->findById($payload['client_id']);

        if (! $client || $client->tenant_id !== $tenantId) {
            throw ValidationException::withMessages([
                'client_id' => ['The selected client is invalid for the current tenant.'],
            ]);
        }

        $product = $this->products->findByIdForDisplay($payload['product_id']);

        if (! $product || $product->tenant_id !== $tenantId) {
            throw ValidationException::withMessages([
                'product_id' => ['The selected product is invalid for the current tenant.'],
            ]);
        }

        $orderId = $payload['order_id'] ?? null;

        if ($orderId) {
            $order = $this->orders->findById($orderId);

            if (! $order || $order->tenant_id !== $tenantId || $order->client_id !== $client->id) {
                throw ValidationException::withMessages([
                    'order_id' => ['The selected order is invalid for the current tenant.'],
                ]);
            }
        }

        $ownerId = $payload['user_id'] ?? $service?->user_id ?? $actor->id;

        if ($ownerId) {
            $owner = $this->users->findById($ownerId);

            if (! $owner || $owner->tenant_id !== $tenantId) {
                throw ValidationException::withMessages([
                    'user_id' => ['The selected owner is invalid for the current tenant.'],
                ]);
            }
        }

        $server = null;

        if (filled($payload['server_id'] ?? null)) {
            $server = $this->servers->findById((string) $payload['server_id']);

            if (! $server || $server->tenant_id !== $tenantId) {
                throw ValidationException::withMessages([
                    'server_id' => ['The selected server is invalid for the current tenant.'],
                ]);
            }
        }

        $serverPackageId = $payload['server_package_id'] ?? null;

        if ($serverPackageId) {
            $serverPackage = optional($server)->packages()->find($serverPackageId)
                ?? \App\Models\ServerPackage::query()->find($serverPackageId);

            if (! $serverPackage || $serverPackage->tenant_id !== $tenantId || $serverPackage->product_id !== $product->id) {
                throw ValidationException::withMessages([
                    'server_package_id' => ['The selected server package is invalid for the current tenant.'],
                ]);
            }

            $server ??= $serverPackage->server;
        }

        return [
            'tenant_id' => $tenantId,
            'client_id' => $client->id,
            'product_id' => $product->id,
            'order_id' => $orderId,
            'user_id' => $ownerId,
            'server_id' => $server?->id,
            'server_package_id' => $payload['server_package_id'] ?? $service?->server_package_id,
            'reference_number' => $service?->reference_number ?? (
                filled($payload['reference_number'] ?? null)
                    ? trim((string) $payload['reference_number'])
                    : $this->generateReferenceNumber()
            ),
            'service_type' => $payload['service_type'] ?? $service?->service_type ?? Service::TYPE_HOSTING,
            'status' => $payload['status'] ?? $service?->status ?? Service::STATUS_PENDING,
            'provisioning_state' => $payload['provisioning_state'] ?? $service?->provisioning_state ?? Service::PROVISIONING_IDLE,
            'billing_cycle' => $payload['billing_cycle'] ?? $service?->billing_cycle,
            'domain' => $payload['domain'] ?? $service?->domain,
            'username' => $payload['username'] ?? $service?->username,
            'external_reference' => $payload['external_reference'] ?? $service?->external_reference,
            'last_operation' => $payload['last_operation'] ?? $service?->last_operation,
            'activated_at' => $payload['activated_at'] ?? optional($service?->activated_at)?->toIso8601String(),
            'suspended_at' => $payload['suspended_at'] ?? optional($service?->suspended_at)?->toIso8601String(),
            'terminated_at' => $payload['terminated_at'] ?? optional($service?->terminated_at)?->toIso8601String(),
            'last_synced_at' => $payload['last_synced_at'] ?? optional($service?->last_synced_at)?->toIso8601String(),
            'notes' => $payload['notes'] ?? $service?->notes,
            'metadata' => $payload['metadata'] ?? $service?->metadata,
        ];
    }

    private function resolveTargetInfrastructure(Service $service, array $payload = []): array
    {
        $service = $this->getServiceForDisplay($service);

        if (filled($payload['server_package_id'] ?? null)) {
            $serverPackage = \App\Models\ServerPackage::query()
                ->with('server')
                ->find($payload['server_package_id']);

            if (! $serverPackage || $serverPackage->tenant_id !== $service->tenant_id || $serverPackage->product_id !== $service->product_id) {
                throw ValidationException::withMessages([
                    'server_package_id' => ['The selected server package is invalid for the current tenant.'],
                ]);
            }

            $server = $serverPackage->server;
            $this->serverSelector->assertActiveServer($server);

            return [$server, $serverPackage];
        }

        $server = $this->serverSelector->resolveServerForService($service);
        $serverPackage = $this->serverSelector->resolvePackageForService($service);

        if ($serverPackage && $serverPackage->server_id !== $server->id) {
            throw ValidationException::withMessages([
                'server_package_id' => ['The resolved package does not belong to the resolved server.'],
            ]);
        }

        return [$server, $serverPackage];
    }

    private function executeDriverOperation(
        object $driver,
        string $operation,
        ProvisioningContext $context
    ): \App\Provisioning\Data\ProvisioningResult {
        return match ($operation) {
            ProvisioningJob::OPERATION_CREATE_ACCOUNT => $driver->createAccount($context),
            ProvisioningJob::OPERATION_SUSPEND_ACCOUNT => $driver->suspendAccount($context),
            ProvisioningJob::OPERATION_UNSUSPEND_ACCOUNT => $driver->unsuspendAccount($context),
            ProvisioningJob::OPERATION_TERMINATE_ACCOUNT => $driver->terminateAccount($context),
            ProvisioningJob::OPERATION_CHANGE_PACKAGE => $driver->changePackage($context),
            ProvisioningJob::OPERATION_RESET_PASSWORD => $driver->resetPassword($context),
            ProvisioningJob::OPERATION_SYNC_USAGE => $driver->syncUsage($context),
            ProvisioningJob::OPERATION_SYNC_SERVICE_STATUS => $driver->syncServiceStatus($context),
            default => throw ValidationException::withMessages([
                'operation' => ['The requested provisioning operation is invalid.'],
            ]),
        };
    }

    private function applyOperationState(
        Service $service,
        Server $server,
        ?\App\Models\ServerPackage $serverPackage,
        string $operation,
        array $payload
    ): array {
        $attributes = [
            'server_id' => $server->id,
            'server_package_id' => $serverPackage?->id ?? $service->server_package_id,
            'last_operation' => $operation,
        ];

        return match ($operation) {
            ProvisioningJob::OPERATION_CREATE_ACCOUNT => $this->applyCreateAccountState($service, $server, $attributes, $payload),
            ProvisioningJob::OPERATION_SUSPEND_ACCOUNT => $this->applySuspendState($service, $attributes),
            ProvisioningJob::OPERATION_UNSUSPEND_ACCOUNT => $this->applyUnsuspendState($service, $attributes),
            ProvisioningJob::OPERATION_TERMINATE_ACCOUNT => $this->applyTerminateState($service, $server, $attributes),
            ProvisioningJob::OPERATION_CHANGE_PACKAGE => array_merge($attributes, [
                'provisioning_state' => Service::PROVISIONING_PLACEHOLDER,
            ]),
            ProvisioningJob::OPERATION_RESET_PASSWORD => $this->applyResetPasswordState($service, $attributes, $payload),
            ProvisioningJob::OPERATION_SYNC_USAGE => $this->applyUsageSyncState($service, $attributes, $payload),
            ProvisioningJob::OPERATION_SYNC_SERVICE_STATUS => $this->applyStatusSyncState($service, $attributes, $payload),
            default => $attributes,
        };
    }

    private function applyCreateAccountState(Service $service, Server $server, array $attributes, array $payload): array
    {
        if (! in_array($service->status, [Service::STATUS_ACTIVE, Service::STATUS_SUSPENDED, Service::STATUS_TERMINATED], true)) {
            $server->increment('current_accounts');
        }

        $username = $payload['username'] ?? $service->username;
        $password = $payload['password'] ?? null;
        $existingCredentials = (array) ($service->credentials?->credentials ?? []);

        $service->credentials()->updateOrCreate(
            ['service_id' => $service->id],
            [
                'tenant_id' => $service->tenant_id,
                'credentials' => array_filter(array_merge($existingCredentials, [
                    'username' => $username,
                    'password' => $password,
                ]), static fn (mixed $value): bool => filled($value)),
                'control_panel_url' => $server->api_endpoint,
                'access_url' => filled($service->domain)
                    ? sprintf('https://%s', $service->domain)
                    : null,
                'metadata' => [
                    'driver' => $server->panel_type,
                ],
            ]
        );

        return array_merge($attributes, [
            'status' => Service::STATUS_ACTIVE,
            'provisioning_state' => Service::PROVISIONING_PLACEHOLDER,
            'activated_at' => $service->activated_at ?? now(),
            'external_reference' => $service->external_reference ?: ($username ?: Str::upper($server->panel_type . '-' . Str::random(10))),
            'username' => $username,
        ]);
    }

    private function applySuspendState(Service $service, array $attributes): array
    {
        $service->suspensions()->create([
            'tenant_id' => $service->tenant_id,
            'user_id' => null,
            'reason' => 'Suspended by provisioning foundation operation.',
            'suspended_at' => now(),
            'metadata' => ['driver' => optional($service->server)->panel_type],
        ]);

        return array_merge($attributes, [
            'status' => Service::STATUS_SUSPENDED,
            'provisioning_state' => Service::PROVISIONING_PLACEHOLDER,
            'suspended_at' => now(),
        ]);
    }

    private function applyUnsuspendState(Service $service, array $attributes): array
    {
        $service->suspensions()
            ->whereNull('unsuspended_at')
            ->latest('suspended_at')
            ->first()
            ?->update([
                'unsuspended_at' => now(),
            ]);

        return array_merge($attributes, [
            'status' => Service::STATUS_ACTIVE,
            'provisioning_state' => Service::PROVISIONING_PLACEHOLDER,
            'suspended_at' => null,
        ]);
    }

    private function applyTerminateState(Service $service, Server $server, array $attributes): array
    {
        if (in_array($service->status, [Service::STATUS_ACTIVE, Service::STATUS_SUSPENDED, Service::STATUS_PROVISIONING], true)) {
            $server->update([
                'current_accounts' => max(0, $server->current_accounts - 1),
            ]);
        }

        return array_merge($attributes, [
            'status' => Service::STATUS_TERMINATED,
            'provisioning_state' => Service::PROVISIONING_PLACEHOLDER,
            'terminated_at' => now(),
        ]);
    }

    private function applyResetPasswordState(Service $service, array $attributes, array $payload): array
    {
        $password = $payload['password'] ?? Str::password(16);

        $service->credentials()->updateOrCreate(
            ['service_id' => $service->id],
            [
                'tenant_id' => $service->tenant_id,
                'credentials' => array_filter(array_merge(
                    (array) ($service->credentials?->credentials ?? []),
                    [
                        'username' => $service->username,
                        'password' => $password,
                    ],
                ), static fn (mixed $value): bool => filled($value)),
                'metadata' => [
                    'updated_at' => now()->toIso8601String(),
                    'driver' => optional($service->server)->panel_type,
                ],
            ]
        );

        return array_merge($attributes, [
            'provisioning_state' => Service::PROVISIONING_PLACEHOLDER,
        ]);
    }

    private function applyUsageSyncState(Service $service, array $attributes, array $payload): array
    {
        $service->usage()->updateOrCreate(
            ['service_id' => $service->id],
            [
                'tenant_id' => $service->tenant_id,
                'disk_used_mb' => (int) ($payload['disk_used_mb'] ?? 0),
                'disk_limit_mb' => (int) ($payload['disk_limit_mb'] ?? 0),
                'bandwidth_used_mb' => (int) ($payload['bandwidth_used_mb'] ?? 0),
                'bandwidth_limit_mb' => (int) ($payload['bandwidth_limit_mb'] ?? 0),
                'email_accounts_used' => (int) ($payload['email_accounts_used'] ?? 0),
                'databases_used' => (int) ($payload['databases_used'] ?? 0),
                'last_synced_at' => now(),
                'metadata' => [
                    'driver' => optional($service->server)->panel_type,
                ],
            ]
        );

        return array_merge($attributes, [
            'provisioning_state' => Service::PROVISIONING_SYNCED,
            'last_synced_at' => now(),
        ]);
    }

    private function applyStatusSyncState(Service $service, array $attributes, array $payload): array
    {
        $status = $payload['service_status'] ?? $service->status;

        if (! in_array($status, Service::statuses(), true)) {
            $status = $service->status;
        }

        if ($status === Service::STATUS_SUSPENDED) {
            $activeSuspension = $service->suspensions()
                ->whereNull('unsuspended_at')
                ->latest('suspended_at')
                ->first();

            if (! $activeSuspension) {
                $service->suspensions()->create([
                    'tenant_id' => $service->tenant_id,
                    'user_id' => null,
                    'reason' => $payload['suspend_reason'] ?? 'Suspended on the control panel.',
                    'suspended_at' => now(),
                    'metadata' => ['driver' => optional($service->server)->panel_type],
                ]);
            }
        }

        if ($status === Service::STATUS_ACTIVE) {
            $service->suspensions()
                ->whereNull('unsuspended_at')
                ->latest('suspended_at')
                ->first()
                ?->update([
                    'unsuspended_at' => now(),
                ]);
        }

        return array_merge($attributes, [
            'status' => $status,
            'provisioning_state' => Service::PROVISIONING_SYNCED,
            'last_synced_at' => now(),
            'suspended_at' => $status === Service::STATUS_SUSPENDED ? ($service->suspended_at ?? now()) : null,
            'terminated_at' => $status === Service::STATUS_TERMINATED ? ($service->terminated_at ?? now()) : $service->terminated_at,
        ]);
    }

    private function generateReferenceNumber(): string
    {
        return 'SVC-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(6));
    }
}
