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
use App\Models\OrderItem;
use App\Models\User;
use App\Provisioning\Contracts\ProvisioningDriverInterface;
use App\Provisioning\Data\ProvisioningContext;
use App\Provisioning\DTOs\ProvisionPayload;
use App\Provisioning\Exceptions\ProvisioningException;
use App\Provisioning\ProvisioningDriverManager;
use App\Provisioning\ProvisioningJobDispatcher;
use App\Provisioning\ProvisioningLogger;
use App\Provisioning\ServerSelector;
use App\Services\Notifications\NotificationDispatchService;
use App\Services\Notifications\NotificationEventCatalog;
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
        private readonly NotificationDispatchService $notifications,
    ) {}

    public function paginateServices(array $filters): LengthAwarePaginator
    {
        return $this->services->paginate($filters);
    }

    public function paginateServicesForPortal(User $user, array $filters): LengthAwarePaginator
    {
        return $this->services->paginateForPortal($user, $filters);
    }

    public function getServiceForDisplay(Service $service): Service
    {
        return $this->services->findByIdForDisplay($service->getKey()) ?? $service;
    }

    public function getServiceForPortalDisplay(User $user, Service $service): ?Service
    {
        return $this->services->findByIdForPortalDisplay($user, $service->getKey());
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

    public function duplicateService(Service $service, User $actor): Service
    {
        return DB::transaction(function () use ($service, $actor): Service {
            if ($service->tenant_id !== $actor->tenant_id) {
                throw ValidationException::withMessages([
                    'service' => ['The selected service is invalid for the current tenant.'],
                ]);
            }

            $copy = $this->services->create([
                'tenant_id' => $service->tenant_id,
                'client_id' => $service->client_id,
                'product_id' => $service->product_id,
                'order_id' => null,
                'order_item_id' => null,
                'user_id' => $actor->id,
                'server_id' => $service->server_id,
                'server_package_id' => $service->server_package_id,
                'reference_number' => $this->generateReferenceNumber(),
                'service_type' => $service->service_type,
                'status' => Service::STATUS_PENDING,
                'provisioning_state' => Service::PROVISIONING_IDLE,
                'billing_cycle' => $service->billing_cycle,
                'price' => $service->price,
                'currency' => $service->currency,
                'domain' => $this->duplicateNullableIdentifier($service->domain),
                'username' => $this->duplicateNullableIdentifier($service->username),
                'registration_date' => now()->toDateString(),
                'next_due_date' => $service->next_due_date?->toDateString(),
                'termination_date' => null,
                'external_reference' => null,
                'last_operation' => null,
                'activated_at' => null,
                'suspended_at' => null,
                'terminated_at' => null,
                'last_synced_at' => null,
                'notes' => trim((string) collect([
                    $service->notes,
                    "Duplicated from service {$service->reference_number}. Review domain and username before provisioning.",
                ])->filter()->implode("\n")),
                'metadata' => array_replace_recursive((array) ($service->metadata ?? []), [
                    'duplicate' => [
                        'source_service_id' => $service->id,
                        'source_reference_number' => $service->reference_number,
                        'duplicated_at' => now()->toIso8601String(),
                        'duplicated_by_user_id' => $actor->id,
                    ],
                ]),
            ]);

            $this->logger->recordServiceNote(
                $copy,
                'Service record duplicated for review before provisioning.',
                ['source_service_id' => $service->id]
            );

            return $this->getServiceForDisplay($copy);
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
            $payload = $this->prepareDispatchPayload($service, $operation, $payload);
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
        } catch (ValidationException $exception) {
            $errors = $exception->errors();
            $message = collect($errors)->flatten()->first()
                ?? $exception->getMessage();

            $this->markQueuedJobFailed(
                jobId: $jobId,
                message: (string) $message,
                requestPayload: $job->payload ?? [],
                shouldThrow: false,
            );

            return;
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

        $shouldNotifyActivation = $job->operation === ProvisioningJob::OPERATION_CREATE_ACCOUNT
            && $service->status !== Service::STATUS_ACTIVE;

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

        if ($shouldNotifyActivation) {
            $this->dispatchServiceActivatedNotification($service->fresh(['client', 'product', 'tenant']));
        }
    }

    public function processCreateAccountForService(string $serviceId, int $attempts = 1): void
    {
        $job = ProvisioningJob::query()
            ->where('service_id', $serviceId)
            ->where('operation', ProvisioningJob::OPERATION_CREATE_ACCOUNT)
            ->whereIn('status', [
                ProvisioningJob::STATUS_QUEUED,
                ProvisioningJob::STATUS_PROCESSING,
            ])
            ->latest('requested_at')
            ->first();

        if (! $job) {
            return;
        }

        $this->processQueuedJob($job->id, $attempts);
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

    public function markCreateAccountFailedForService(
        string $serviceId,
        string $message,
        array $requestPayload = [],
        array $responsePayload = [],
        bool $shouldThrow = true
    ): void {
        $job = ProvisioningJob::query()
            ->where('service_id', $serviceId)
            ->where('operation', ProvisioningJob::OPERATION_CREATE_ACCOUNT)
            ->whereIn('status', [
                ProvisioningJob::STATUS_QUEUED,
                ProvisioningJob::STATUS_PROCESSING,
            ])
            ->latest('requested_at')
            ->first();

        if (! $job) {
            if ($shouldThrow) {
                throw ValidationException::withMessages([
                    'service' => ['The queued create-account job could not be found for this service.'],
                ]);
            }

            return;
        }

        $this->markQueuedJobFailed(
            $job->id,
            $message,
            $requestPayload,
            $responsePayload,
            $shouldThrow,
        );
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

        $orderId = $payload['order_id'] ?? $service?->order_id;

        if ($orderId) {
            $order = $this->orders->findById($orderId);

            if (! $order || $order->tenant_id !== $tenantId || $order->client_id !== $client->id) {
                throw ValidationException::withMessages([
                    'order_id' => ['The selected order is invalid for the current tenant.'],
                ]);
            }
        }

        $orderItemId = $payload['order_item_id'] ?? $service?->order_item_id;

        if ($orderItemId) {
            $orderItem = OrderItem::query()->find($orderItemId);

            if (! $orderItem
                || $orderItem->tenant_id !== $tenantId
                || $orderItem->product_id !== $product->id
                || ($orderId && $orderItem->order_id !== $orderId)) {
                throw ValidationException::withMessages([
                    'order_item_id' => ['The selected order item is invalid for the current tenant.'],
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

        if (! $server && $service?->server_id) {
            $server = $this->servers->findById((string) $service->server_id);
        }

        if (! $server && $product->server_id) {
            $server = $this->servers->findById((string) $product->server_id);

            if (! $server || $server->tenant_id !== $tenantId) {
                throw ValidationException::withMessages([
                    'server_id' => ['The product linked server is invalid for the current tenant.'],
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
            'order_item_id' => $orderItemId,
            'user_id' => $ownerId,
            'server_id' => $server?->id,
            'server_package_id' => $payload['server_package_id'] ?? $service?->server_package_id,
            'reference_number' => $service?->reference_number ?? (
                filled($payload['reference_number'] ?? null)
                    ? trim((string) $payload['reference_number'])
                    : $this->generateReferenceNumber()
            ),
            'service_type' => $payload['service_type'] ?? $service?->service_type ?? Service::TYPE_HOSTING,
            'status' => $service?->status ?? Service::STATUS_PENDING,
            'provisioning_state' => $service?->provisioning_state ?? Service::PROVISIONING_IDLE,
            'billing_cycle' => $payload['billing_cycle'] ?? $service?->billing_cycle,
            'price' => $payload['price'] ?? $service?->price ?? 0,
            'currency' => $payload['currency'] ?? $service?->currency ?? config('hostinvo.default_currency', 'USD'),
            'domain' => $payload['domain'] ?? $service?->domain,
            'username' => $payload['username'] ?? $service?->username,
            'registration_date' => $payload['registration_date'] ?? optional($service?->registration_date)?->toDateString(),
            'next_due_date' => $payload['next_due_date'] ?? optional($service?->next_due_date)?->toDateString(),
            'termination_date' => $payload['termination_date'] ?? optional($service?->termination_date)?->toDateString(),
            'external_reference' => $service?->external_reference,
            'last_operation' => $service?->last_operation,
            'activated_at' => optional($service?->activated_at)?->toIso8601String(),
            'suspended_at' => optional($service?->suspended_at)?->toIso8601String(),
            'terminated_at' => optional($service?->terminated_at)?->toIso8601String(),
            'last_synced_at' => optional($service?->last_synced_at)?->toIso8601String(),
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
        ProvisioningDriverInterface $driver,
        string $operation,
        ProvisioningContext $context
    ): \App\Provisioning\Data\ProvisioningResult {
        return match ($operation) {
            ProvisioningJob::OPERATION_CREATE_ACCOUNT => $this->handleCreateAccount($driver, $context),
            ProvisioningJob::OPERATION_SUSPEND_ACCOUNT => $this->handleBooleanOperation(
                $driver,
                $context,
                $operation,
                fn () => $driver->suspendAccount(
                    $this->resolveDriverAccountIdentifier($context),
                    (string) ($context->payload['reason'] ?? 'Suspended by Hostinvo.')
                ),
            ),
            ProvisioningJob::OPERATION_UNSUSPEND_ACCOUNT => $this->handleBooleanOperation(
                $driver,
                $context,
                $operation,
                fn () => $driver->unsuspendAccount($this->resolveDriverAccountIdentifier($context)),
            ),
            ProvisioningJob::OPERATION_TERMINATE_ACCOUNT => $this->handleBooleanOperation(
                $driver,
                $context,
                $operation,
                fn () => $driver->terminateAccount($this->resolveDriverAccountIdentifier($context)),
            ),
            ProvisioningJob::OPERATION_CHANGE_PACKAGE => $this->handleBooleanOperation(
                $driver,
                $context,
                $operation,
                fn () => $driver->changePackage(
                    $this->resolveDriverAccountIdentifier($context),
                    $this->resolvePanelPackageName($context),
                ),
                operationPayload: [
                    'panel_package_name' => $this->resolvePanelPackageName($context),
                ],
            ),
            ProvisioningJob::OPERATION_RESET_PASSWORD => $this->handleResetPassword($driver, $context, $operation),
            ProvisioningJob::OPERATION_SYNC_USAGE => $this->handleUsageSync($driver, $context),
            ProvisioningJob::OPERATION_SYNC_SERVICE_STATUS => $this->handleStatusSync($driver, $context),
            default => throw ValidationException::withMessages([
                'operation' => ['The requested provisioning operation is invalid.'],
            ]),
        };
    }

    private function handleCreateAccount(
        ProvisioningDriverInterface $driver,
        ProvisioningContext $context
    ): \App\Provisioning\Data\ProvisioningResult {
        $payload = $this->buildProvisionPayload($context);
        $result = $driver->createAccount($payload);
        $telemetry = $this->consumeDriverTelemetry($driver);

        return \App\Provisioning\Data\ProvisioningResult::success(
            message: sprintf('Provisioning create account completed for %s.', $result->username),
            requestPayload: $telemetry['request'] ?: $payload->sanitized(),
            responsePayload: $telemetry['response'] ?: ['raw_response' => $result->rawResponse],
            serviceAttributes: array_filter([
                'username' => $result->username,
                'external_reference' => $context->server->panel_type === Server::PANEL_PLESK
                    ? $payload->domain
                    : $result->username,
                'provisioning_state' => Service::PROVISIONING_SYNCED,
            ], static fn (mixed $value): bool => filled($value)),
            operationPayload: array_filter([
                'username' => $result->username,
                'domain' => $payload->domain,
                'panel_package_name' => $payload->packageName,
                'ip_address' => $result->ip,
            ], static fn (mixed $value): bool => filled($value)),
        );
    }

    private function handleBooleanOperation(
        ProvisioningDriverInterface $driver,
        ProvisioningContext $context,
        string $operation,
        \Closure $callback,
        array $operationPayload = [],
    ): \App\Provisioning\Data\ProvisioningResult {
        $successful = $callback();
        $telemetry = $this->consumeDriverTelemetry($driver);

        if (! $successful) {
            return \App\Provisioning\Data\ProvisioningResult::failure(
                message: sprintf('Provisioning %s failed.', $operation),
                requestPayload: $telemetry['request'],
                responsePayload: $telemetry['response'],
            );
        }

        return \App\Provisioning\Data\ProvisioningResult::success(
            message: sprintf('Provisioning %s completed.', $operation),
            requestPayload: $telemetry['request'],
            responsePayload: $telemetry['response'],
            serviceAttributes: [
                'provisioning_state' => Service::PROVISIONING_SYNCED,
            ],
            operationPayload: $operationPayload,
        );
    }

    private function handleUsageSync(
        ProvisioningDriverInterface $driver,
        ProvisioningContext $context
    ): \App\Provisioning\Data\ProvisioningResult {
        $identifier = $this->resolveDriverAccountIdentifier($context);
        $usage = $driver->syncUsage($identifier);
        $telemetry = $this->consumeDriverTelemetry($driver);

        return \App\Provisioning\Data\ProvisioningResult::success(
            message: sprintf('Provisioning usage sync completed for %s.', $identifier),
            requestPayload: $telemetry['request'] ?: ['identifier' => $identifier],
            responsePayload: $telemetry['response'] ?: ['raw_response' => $usage->rawResponse],
            serviceAttributes: [
                'provisioning_state' => Service::PROVISIONING_SYNCED,
                'external_reference' => $context->server->panel_type === Server::PANEL_PLESK ? $identifier : $context->service->external_reference,
            ],
            operationPayload: [
                'disk_used_mb' => $usage->diskUsedMb,
                'disk_limit_mb' => $usage->diskLimitMb ?? 0,
                'bandwidth_used_mb' => $usage->bandwidthUsedMb,
                'bandwidth_limit_mb' => $usage->bandwidthLimitMb ?? 0,
                'inodes_used' => $usage->inodesUsed,
                'email_accounts_used' => $usage->emailAccountsUsed,
                'databases_used' => $usage->databasesUsed,
                'service_status' => $usage->serviceStatus,
                'suspend_reason' => $usage->suspendReason,
                'panel_package_name' => $usage->packageName,
            ],
        );
    }

    private function handleResetPassword(
        ProvisioningDriverInterface $driver,
        ProvisioningContext $context,
        string $operation
    ): \App\Provisioning\Data\ProvisioningResult {
        $this->persistProvisioningSecret(
            $context->service,
            $operation,
            is_string($context->payload['password'] ?? null) ? (string) $context->payload['password'] : null,
        );

        return $this->handleBooleanOperation(
            $driver,
            $context,
            $operation,
            fn () => $driver->resetPassword(
                $this->resolveDriverAccountIdentifier($context),
                $context->service->id,
            ),
        );
    }

    private function handleStatusSync(
        ProvisioningDriverInterface $driver,
        ProvisioningContext $context
    ): \App\Provisioning\Data\ProvisioningResult {
        $identifier = $this->resolveDriverAccountIdentifier($context);
        $status = $driver->syncServiceStatus($identifier);
        $telemetry = $this->consumeDriverTelemetry($driver);

        return \App\Provisioning\Data\ProvisioningResult::success(
            message: sprintf('Provisioning status sync completed for %s.', $identifier),
            requestPayload: $telemetry['request'] ?: ['identifier' => $identifier],
            responsePayload: $telemetry['response'] ?: ['raw_response' => $status->rawResponse],
            serviceAttributes: [
                'provisioning_state' => Service::PROVISIONING_SYNCED,
                'external_reference' => $context->server->panel_type === Server::PANEL_PLESK ? $identifier : $context->service->external_reference,
            ],
            operationPayload: [
                'service_status' => $status->status,
                'suspend_reason' => $status->suspendReason,
                'panel_package_name' => $status->packageName,
            ],
        );
    }

    private function buildProvisionPayload(ProvisioningContext $context): ProvisionPayload
    {
        $username = trim((string) ($context->payload['username']
            ?? $context->service->username
            ?? ($context->service->domain ? Str::before($context->service->domain, '.') : '')
            ?? ''));
        $domain = trim((string) ($context->payload['domain']
            ?? $context->service->domain
            ?? $context->service->external_reference
            ?? ''));
        $packageName = $this->resolvePanelPackageName($context);
        $email = (string) ($context->service->client?->email ?? 'provisioning@hostinvo.test');
        $this->persistProvisioningSecret(
            $context->service,
            ProvisioningJob::OPERATION_CREATE_ACCOUNT,
            is_string($context->payload['password'] ?? null) ? (string) $context->payload['password'] : null,
        );
        $ip = trim((string) ($context->payload['ip_address'] ?? $context->server->ip_address ?? $this->inferServerIp($context->server)));

        if ($username === '' || $domain === '' || $packageName === '' || $ip === '') {
            throw ValidationException::withMessages([
                'provisioning' => ['Provisioning payload is incomplete for account creation.'],
            ]);
        }

        return new ProvisionPayload(
            serviceId: $context->service->id,
            username: $username,
            domain: $domain,
            email: $email,
            packageName: $packageName,
            ip: $ip,
            contactEmail: $email,
        );
    }

    private function resolvePanelPackageName(ProvisioningContext $context): string
    {
        return trim((string) (
            $context->payload['panel_package_name']
            ?? $context->serverPackage?->panel_package_name
            ?? $context->service->product?->provisioning_package
            ?? ''
        ));
    }

    private function resolveDriverAccountIdentifier(ProvisioningContext $context): string
    {
        if ($context->server->panel_type === Server::PANEL_PLESK) {
            $identifier = trim((string) ($context->payload['domain']
                ?? $context->service->external_reference
                ?? $context->service->domain
                ?? ''));

            if ($identifier !== '') {
                return $identifier;
            }
        }

        $identifier = trim((string) ($context->payload['username']
            ?? $context->service->username
            ?? $context->service->external_reference
            ?? ''));

        if ($identifier === '') {
            throw ValidationException::withMessages([
                'username' => ['A provisioning account identifier is required for this operation.'],
            ]);
        }

        return $identifier;
    }

    private function inferServerIp(Server $server): string
    {
        if (filled($server->ip_address)) {
            return (string) $server->ip_address;
        }

        $endpoint = trim((string) ($server->api_endpoint ?: $server->hostname));

        if ($endpoint === '') {
            return '';
        }

        if (! preg_match('/^https?:\/\//i', $endpoint)) {
            $endpoint = 'https://'.$endpoint;
        }

        return (string) (parse_url($endpoint, PHP_URL_HOST) ?: '');
    }

    private function consumeDriverTelemetry(ProvisioningDriverInterface $driver): array
    {
        if (method_exists($driver, 'consumeTelemetry')) {
            /** @var array{request: array, response: array} $telemetry */
            $telemetry = $driver->consumeTelemetry();

            return $telemetry;
        }

        return [
            'request' => [],
            'response' => [],
        ];
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
                'metadata' => $this->mergeServiceMetadata($service, [
                    'panel' => [
                        'service_plan' => $payload['panel_package_name'] ?? null,
                    ],
                ]),
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
            $server->increment('account_count');
        }

        $username = $payload['username'] ?? $service->username;
        $this->syncServiceCredentialRecord($service, [
            'credentials' => [
                'username' => $username,
            ],
            'control_panel_url' => $server->api_endpoint,
            'access_url' => filled($service->domain)
                ? sprintf('https://%s', $service->domain)
                : null,
            'metadata' => [
                'driver' => $server->panel_type,
            ],
        ]);

        return array_merge($attributes, [
            'status' => Service::STATUS_ACTIVE,
            'provisioning_state' => Service::PROVISIONING_PLACEHOLDER,
            'activated_at' => $service->activated_at ?? now(),
            'external_reference' => $service->external_reference ?: ($username ?: Str::upper($server->panel_type.'-'.Str::random(10))),
            'username' => $username,
            'metadata' => $this->mergeServiceMetadata($service, [
                'panel' => [
                    'service_plan' => $payload['panel_package_name'] ?? null,
                    'ip_address' => $payload['ip_address'] ?? null,
                ],
            ]),
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
            $server->forceFill([
                'account_count' => max(0, $server->current_accounts - 1),
            ])->save();
        }

        return array_merge($attributes, [
            'status' => Service::STATUS_TERMINATED,
            'provisioning_state' => Service::PROVISIONING_PLACEHOLDER,
            'terminated_at' => now(),
        ]);
    }

    private function applyResetPasswordState(Service $service, array $attributes, array $payload): array
    {
        $this->syncServiceCredentialRecord($service, [
            'credentials' => [
                'username' => $service->username,
            ],
            'metadata' => [
                'updated_at' => now()->toIso8601String(),
                'driver' => optional($service->server)->panel_type,
            ],
        ]);

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
                'inodes_used' => (int) ($payload['inodes_used'] ?? 0),
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
            'metadata' => $this->mergeServiceMetadata($service, [
                'panel' => [
                    'service_plan' => $payload['panel_package_name'] ?? null,
                ],
            ]),
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
            'metadata' => $this->mergeServiceMetadata($service, [
                'panel' => [
                    'service_plan' => $payload['panel_package_name'] ?? null,
                ],
            ]),
        ]);
    }

    private function mergeServiceMetadata(Service $service, array $metadata): array
    {
        return array_replace_recursive(
            (array) ($service->metadata ?? []),
            $this->withoutNullMetadata($metadata),
        );
    }

    private function withoutNullMetadata(array $metadata): array
    {
        $normalized = [];

        foreach ($metadata as $key => $value) {
            if (is_array($value)) {
                $nested = $this->withoutNullMetadata($value);

                if ($nested !== []) {
                    $normalized[$key] = $nested;
                }

                continue;
            }

            if ($value !== null) {
                $normalized[$key] = $value;
            }
        }

        return $normalized;
    }

    private function prepareDispatchPayload(Service $service, string $operation, array $payload): array
    {
        if (in_array($operation, [
            ProvisioningJob::OPERATION_CREATE_ACCOUNT,
            ProvisioningJob::OPERATION_RESET_PASSWORD,
        ], true)) {
            $this->persistProvisioningSecret(
                $service,
                $operation,
                is_string($payload['password'] ?? null) ? (string) $payload['password'] : null,
            );
        }

        return Arr::except($payload, ['password']);
    }

    private function persistProvisioningSecret(Service $service, string $operation, ?string $plainPassword = null): string
    {
        $credential = $service->credentials()->first() ?? new \App\Models\ServiceCredential();

        $resolvedPassword = filled($plainPassword)
            ? trim((string) $plainPassword)
            : $credential->decryptValue();

        if ($resolvedPassword === null || $resolvedPassword === '') {
            $resolvedPassword = Str::password(20);
        }

        $credential->tenant_id = $service->tenant_id;
        $credential->service_id = $service->id;
        $credential->key = $credential->key ?: 'primary';
        $credential->credentials = Arr::except((array) ($credential->credentials ?? []), ['password']);
        $credential->storeSecret($resolvedPassword);
        $credential->metadata = array_replace(
            (array) ($credential->metadata ?? []),
            [
                'password_last_rotated_at' => now()->toIso8601String(),
                'password_source_operation' => $operation,
            ],
        );
        $credential->save();

        $service->setRelation('credentials', $credential);

        return $resolvedPassword;
    }

    private function syncServiceCredentialRecord(Service $service, array $attributes): void
    {
        $credential = $service->credentials()->first() ?? new \App\Models\ServiceCredential();

        $credential->tenant_id = $service->tenant_id;
        $credential->service_id = $service->id;
        $credential->key = $credential->key ?: 'primary';

        if (array_key_exists('credentials', $attributes)) {
            $credential->credentials = array_filter(array_merge(
                Arr::except((array) ($credential->credentials ?? []), ['password']),
                Arr::except((array) $attributes['credentials'], ['password']),
            ), static fn (mixed $value): bool => filled($value));
        }

        if (array_key_exists('control_panel_url', $attributes)) {
            $credential->control_panel_url = $attributes['control_panel_url'];
        }

        if (array_key_exists('access_url', $attributes)) {
            $credential->access_url = $attributes['access_url'];
        }

        if (array_key_exists('metadata', $attributes)) {
            $credential->metadata = array_replace_recursive(
                (array) ($credential->metadata ?? []),
                $this->withoutNullMetadata((array) $attributes['metadata']),
            );
        }

        $credential->save();

        $service->setRelation('credentials', $credential);
    }

    private function generateReferenceNumber(): string
    {
        return 'SVC-'.now()->format('YmdHis').'-'.Str::upper(Str::random(6));
    }

    private function duplicateNullableIdentifier(?string $value): ?string
    {
        if (! filled($value)) {
            return null;
        }

        return Str::limit($value.'-copy', 255, '');
    }

    private function dispatchServiceActivatedNotification(?Service $service): void
    {
        if (! $service || $service->status !== Service::STATUS_ACTIVE) {
            return;
        }

        $client = $service->client;
        $tenant = $service->tenant;

        if (! $client || ! $tenant || ! filled($client->email)) {
            return;
        }

        $this->notifications->send(
            email: $client->email,
            event: NotificationEventCatalog::EVENT_SERVICE_ACTIVATED,
            context: [
                'client' => [
                    'name' => $client->display_name,
                    'email' => $client->email,
                ],
                'service' => [
                    'reference_number' => $service->reference_number,
                    'domain' => $service->domain,
                    'status' => $service->status,
                    'product_name' => $service->product?->name,
                ],
            ],
            tenant: $tenant,
            locale: $client->preferred_locale ?: $tenant->default_locale,
        );
    }
}
