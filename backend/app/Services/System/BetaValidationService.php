<?php

namespace App\Services\System;

use App\Models\ProvisioningJob;
use App\Models\ProvisioningLog;
use App\Models\Service;
use App\Models\Subscription;
use App\Payments\Exceptions\PaymentGatewayException;
use App\Services\Billing\PaymentService;
use App\Services\Billing\SubscriptionRenewalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Route;
use Throwable;

class BetaValidationService
{
    public function __construct(
        private readonly HealthCheckService $healthChecks,
        private readonly PaymentService $payments,
        private readonly SubscriptionRenewalService $renewals,
    ) {
    }

    public function runSystemChecks(): array
    {
        $checks = [
            'database' => $this->healthChecks->database(),
            'queue' => $this->healthChecks->queue(),
            'redis' => $this->healthChecks->redis(),
            'workers' => $this->checkWorkerStatus(),
            'monitoring_endpoints' => $this->checkMonitoringEndpoints(),
            'payment_gateway_sandbox' => $this->checkPaymentSandboxConfiguration(),
        ];

        return [
            'status' => $this->aggregateStatus($checks),
            'checks' => $checks,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    public function simulateProvisioning(): array
    {
        try {
            $service = Service::query()
                ->whereNotNull('server_id')
                ->first();
        } catch (Throwable $exception) {
            return [
                'status' => 'fail',
                'message' => 'Provisioning simulation could not read service fixtures.',
                'error' => $exception->getMessage(),
            ];
        }

        if (! $service) {
            return [
                'status' => 'skipped',
                'message' => 'Provisioning simulation skipped because no service linked to a server was found.',
            ];
        }

        DB::beginTransaction();

        try {
            $job = new ProvisioningJob();
            $job->forceFill([
                'tenant_id' => $service->tenant_id,
                'service_id' => $service->id,
                'server_id' => $service->server_id,
                'requested_by_user_id' => $service->user_id,
                'operation' => ProvisioningJob::OPERATION_SYNC_SERVICE_STATUS,
                'status' => ProvisioningJob::STATUS_QUEUED,
                'driver' => $service->server?->panel_type,
                'queue_name' => config('provisioning.queue.name', 'critical'),
                'attempts' => 0,
                'payload' => ['source' => 'beta_validation'],
                'requested_at' => now(),
            ]);
            $job->save();

            $queuedLog = new ProvisioningLog();
            $queuedLog->forceFill([
                'tenant_id' => $service->tenant_id,
                'provisioning_job_id' => $job->id,
                'service_id' => $service->id,
                'server_id' => $service->server_id,
                'operation' => $job->operation,
                'status' => ProvisioningLog::STATUS_QUEUED,
                'driver' => $job->driver,
                'message' => 'Beta validation queued provisioning simulation.',
                'request_payload' => ['source' => 'beta_validation'],
                'response_payload' => [],
                'occurred_at' => now(),
            ]);
            $queuedLog->save();

            $job->forceFill([
                'status' => ProvisioningJob::STATUS_COMPLETED,
                'attempts' => 1,
                'started_at' => now(),
                'completed_at' => now(),
                'result_payload' => ['status' => 'simulated'],
            ])->save();

            $completedLog = new ProvisioningLog();
            $completedLog->forceFill([
                'tenant_id' => $service->tenant_id,
                'provisioning_job_id' => $job->id,
                'service_id' => $service->id,
                'server_id' => $service->server_id,
                'operation' => $job->operation,
                'status' => ProvisioningLog::STATUS_COMPLETED,
                'driver' => $job->driver,
                'message' => 'Beta validation completed provisioning simulation.',
                'request_payload' => ['source' => 'beta_validation'],
                'response_payload' => ['status' => 'simulated'],
                'occurred_at' => now(),
            ]);
            $completedLog->save();

            DB::rollBack();

            return [
                'status' => 'ok',
                'message' => 'Provisioning simulation completed in a rollback transaction.',
                'service_id' => $service->id,
                'operation' => $job->operation,
            ];
        } catch (Throwable $exception) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }

            return [
                'status' => 'fail',
                'message' => 'Provisioning simulation failed.',
                'error' => $exception->getMessage(),
            ];
        }
    }

    public function simulateBillingCycle(): array
    {
        try {
            $subscription = Subscription::query()
                ->where('status', 'active')
                ->orderBy('next_billing_date')
                ->first();
        } catch (Throwable $exception) {
            return [
                'status' => 'fail',
                'message' => 'Billing simulation could not read subscription fixtures.',
                'error' => $exception->getMessage(),
            ];
        }

        if (! $subscription) {
            return [
                'status' => 'skipped',
                'message' => 'Billing simulation skipped because no active subscription was found.',
            ];
        }

        DB::beginTransaction();

        try {
            $beforeNextBillingDate = $subscription->next_billing_date?->toDateString();
            $this->renewals->renew($subscription);
            $subscription->refresh();

            $nextBillingDateAdvanced = $beforeNextBillingDate !== $subscription->next_billing_date?->toDateString();
            $hasLastBilledAt = $subscription->last_billed_at !== null;
            $status = $nextBillingDateAdvanced && $hasLastBilledAt ? 'ok' : 'fail';

            DB::rollBack();

            return [
                'status' => $status,
                'message' => $status === 'ok'
                    ? 'Billing cycle simulation succeeded in a rollback transaction.'
                    : 'Billing cycle simulation did not advance subscription dates as expected.',
                'subscription_id' => $subscription->id,
                'before_next_billing_date' => $beforeNextBillingDate,
                'after_next_billing_date' => $subscription->next_billing_date?->toDateString(),
            ];
        } catch (Throwable $exception) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }

            return [
                'status' => 'fail',
                'message' => 'Billing cycle simulation failed.',
                'error' => $exception->getMessage(),
            ];
        }
    }

    public function simulateWebhookProcessing(): array
    {
        if (! is_array(config('payments.gateways.stripe'))) {
            return [
                'status' => 'skipped',
                'message' => 'Webhook simulation skipped because the Stripe gateway is not configured.',
            ];
        }

        DB::beginTransaction();

        try {
            $payload = json_encode([
                'id' => 'evt_beta_validation',
                'type' => 'checkout.session.completed',
                'created' => now()->timestamp,
                'data' => [
                    'object' => [
                        'id' => 'cs_beta_validation',
                        'metadata' => [],
                    ],
                ],
            ], JSON_THROW_ON_ERROR);

            $request = Request::create(
                uri: '/api/v1/webhooks/stripe',
                method: 'POST',
                server: [
                    'CONTENT_TYPE' => 'application/json',
                    'HTTP_STRIPE_SIGNATURE' => 't=1710000000,v1=invalid_signature',
                ],
                content: $payload,
            );

            $this->payments->handleWebhook('stripe', $request);

            DB::rollBack();

            return [
                'status' => 'fail',
                'message' => 'Webhook simulation unexpectedly accepted an invalid signature.',
            ];
        } catch (PaymentGatewayException) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }

            return [
                'status' => 'ok',
                'message' => 'Webhook simulation confirmed invalid signatures are rejected.',
            ];
        } catch (Throwable $exception) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }

            return [
                'status' => 'fail',
                'message' => 'Webhook simulation failed.',
                'error' => $exception->getMessage(),
            ];
        }
    }

    private function checkWorkerStatus(): array
    {
        $processCommand = PHP_OS_FAMILY === 'Windows'
            ? 'wmic process get CommandLine'
            : 'ps aux';

        $result = Process::timeout(5)->run($processCommand);

        if (! $result->successful()) {
            return [
                'status' => 'degraded',
                'message' => 'Worker process check command could not be executed.',
            ];
        }

        $output = strtolower($result->output());
        $queueWorkerRunning = str_contains($output, 'artisan queue:work');
        $schedulerRunning = str_contains($output, 'artisan schedule:work')
            || str_contains($output, 'artisan schedule:run');

        $status = $queueWorkerRunning && $schedulerRunning ? 'ok' : 'degraded';

        return [
            'status' => $status,
            'message' => $status === 'ok'
                ? 'Queue worker and scheduler processes are visible.'
                : 'Queue worker and/or scheduler process was not detected.',
            'queue_worker_running' => $queueWorkerRunning,
            'scheduler_running' => $schedulerRunning,
        ];
    }

    private function checkMonitoringEndpoints(): array
    {
        $requiredRoutes = [
            'health.index' => '/health',
            'health.database' => '/health/database',
            'health.queue' => '/health/queue',
            'health.redis' => '/health/redis',
            'metrics.prometheus' => '/metrics',
            'metrics.json' => '/metrics/json',
        ];

        $registered = [];

        foreach ($requiredRoutes as $routeName => $uri) {
            $registered[$uri] = Route::has($routeName);
        }

        $allRegistered = ! in_array(false, $registered, true);

        return [
            'status' => $allRegistered ? 'ok' : 'fail',
            'message' => $allRegistered
                ? 'Monitoring and health endpoints are registered.'
                : 'One or more monitoring endpoints are missing.',
            'registered_routes' => $registered,
        ];
    }

    private function checkPaymentSandboxConfiguration(): array
    {
        $stripe = (array) config('payments.gateways.stripe', []);
        $paypal = (array) config('payments.gateways.paypal', []);
        $issues = [];

        $stripeEnabled = (bool) ($stripe['enabled'] ?? false);
        $stripePublishableKey = (string) ($stripe['publishable_key'] ?? '');
        $stripeSecretKey = (string) ($stripe['secret_key'] ?? '');

        if ($stripeEnabled) {
            if ($stripePublishableKey !== '' && str_starts_with($stripePublishableKey, 'pk_live_')) {
                $issues[] = 'Stripe publishable key appears to be a live key.';
            }

            if ($stripeSecretKey !== '' && str_starts_with($stripeSecretKey, 'sk_live_')) {
                $issues[] = 'Stripe secret key appears to be a live key.';
            }
        }

        $paypalEnabled = (bool) ($paypal['enabled'] ?? false);
        $paypalMode = strtolower((string) ($paypal['mode'] ?? 'sandbox'));

        if ($paypalEnabled && $paypalMode !== 'sandbox') {
            $issues[] = 'PayPal mode must remain sandbox in beta/staging.';
        }

        return [
            'status' => $issues === [] ? 'ok' : 'fail',
            'message' => $issues === []
                ? 'Payment gateway sandbox safety checks passed.'
                : 'Payment gateway sandbox safety checks failed.',
            'issues' => $issues,
        ];
    }

    /**
     * @param  array<string, array{status:string}>  $checks
     */
    private function aggregateStatus(array $checks): string
    {
        $statuses = array_map(
            static fn (array $check): string => (string) ($check['status'] ?? 'fail'),
            $checks
        );

        if (in_array('fail', $statuses, true)) {
            return 'fail';
        }

        if (in_array('degraded', $statuses, true)) {
            return 'degraded';
        }

        return 'ok';
    }
}
