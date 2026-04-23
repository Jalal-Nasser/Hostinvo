<?php

namespace App\Services\Billing;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Service;
use App\Models\Subscription;
use App\Models\User;

class BillingAutomationService
{
    public function __construct(
        private readonly InvoiceService $invoices,
        private readonly SubscriptionRenewalService $renewals,
    ) {
    }

    public function run(): array
    {
        return [
            'generated_invoices' => $this->generateRecurringInvoices(),
            'marked_overdue' => $this->markInvoicesOverdue(),
            'suspended_services' => $this->suspendOverdueServices(),
        ];
    }

    public function generateRecurringInvoices(): int
    {
        $generated = 0;

        Subscription::query()
            ->with(['client', 'service', 'product'])
            ->where('status', 'active')
            ->where('auto_renew', true)
            ->whereDate('next_billing_date', '<=', now()->toDateString())
            ->orderBy('next_billing_date')
            ->chunkById(100, function ($subscriptions) use (&$generated): void {
                foreach ($subscriptions as $subscription) {
                    if (! $subscription->client || ! $subscription->service || ! $subscription->product) {
                        continue;
                    }

                    $alreadyExists = Invoice::query()
                        ->withoutGlobalScopes()
                        ->where('tenant_id', $subscription->tenant_id)
                        ->where('client_id', $subscription->client_id)
                        ->whereJsonContains('metadata->subscription_id', $subscription->id)
                        ->whereDate('issue_date', '>=', $subscription->next_billing_date?->toDateString())
                        ->whereNotIn('status', [Invoice::STATUS_CANCELLED, Invoice::STATUS_REFUNDED])
                        ->exists();

                    if ($alreadyExists) {
                        continue;
                    }

                    $actor = User::query()
                        ->where('tenant_id', $subscription->tenant_id)
                        ->oldest('created_at')
                        ->first();

                    if (! $actor) {
                        continue;
                    }

                    $issueDate = $subscription->next_billing_date?->copy()->startOfDay() ?? now()->startOfDay();
                    $dueDate = $issueDate->copy()->addDays(max(0, (int) $subscription->grace_period_days));

                    $this->invoices->create([
                        'client_id' => $subscription->client_id,
                        'currency' => $subscription->currency,
                        'issue_date' => $issueDate->toDateString(),
                        'due_date' => $dueDate->toDateString(),
                        'status' => Invoice::STATUS_UNPAID,
                        'recurring_cycle' => $subscription->billing_cycle,
                        'next_invoice_date' => $subscription->next_billing_date?->toDateString(),
                        'metadata' => [
                            'source' => 'subscription_renewal',
                            'subscription_id' => $subscription->id,
                            'service_id' => $subscription->service_id,
                            'product_id' => $subscription->product_id,
                        ],
                        'items' => [
                            [
                                'item_type' => InvoiceItem::TYPE_SERVICE,
                                'description' => sprintf(
                                    '%s renewal%s',
                                    $subscription->product->name,
                                    $subscription->service->domain ? ' for '.$subscription->service->domain : ''
                                ),
                                'related_type' => 'service',
                                'related_id' => $subscription->service_id,
                                'billing_cycle' => $subscription->billing_cycle,
                                'billing_period_starts_at' => $issueDate->toDateString(),
                                'billing_period_ends_at' => $subscription->next_billing_date?->toDateString(),
                                'quantity' => 1,
                                'unit_price_minor' => (int) $subscription->price,
                                'metadata' => [
                                    'subscription_id' => $subscription->id,
                                    'service_reference' => $subscription->service->reference_number,
                                ],
                            ],
                        ],
                    ], $actor);

                    $this->renewals->renew($subscription->fresh());
                    $generated++;
                }
            }, 'id');

        return $generated;
    }

    public function markInvoicesOverdue(): int
    {
        return Invoice::query()
            ->withoutGlobalScopes()
            ->where('status', Invoice::STATUS_UNPAID)
            ->where('balance_due_minor', '>', 0)
            ->whereDate('due_date', '<', now()->toDateString())
            ->update([
                'status' => Invoice::STATUS_OVERDUE,
                'updated_at' => now(),
            ]);
    }

    public function suspendOverdueServices(): int
    {
        $suspended = 0;

        Subscription::query()
            ->with(['service'])
            ->where('status', 'active')
            ->orderBy('next_billing_date')
            ->chunkById(100, function ($subscriptions) use (&$suspended): void {
                foreach ($subscriptions as $subscription) {
                    $service = $subscription->service;

                    if (! $service || ! in_array($service->status, [Service::STATUS_ACTIVE, Service::STATUS_PROVISIONING], true)) {
                        continue;
                    }

                    $oldestOverdueInvoice = Invoice::query()
                        ->withoutGlobalScopes()
                        ->where('tenant_id', $subscription->tenant_id)
                        ->where('client_id', $subscription->client_id)
                        ->whereIn('status', [Invoice::STATUS_UNPAID, Invoice::STATUS_OVERDUE])
                        ->where('balance_due_minor', '>', 0)
                        ->orderBy('due_date')
                        ->get()
                        ->first(function (Invoice $invoice) use ($subscription): bool {
                            $metadata = (array) ($invoice->metadata ?? []);

                            return ($metadata['subscription_id'] ?? null) === $subscription->id
                                || ($metadata['service_id'] ?? null) === $subscription->service_id;
                        });

                    if (! $oldestOverdueInvoice || ! $oldestOverdueInvoice->due_date) {
                        continue;
                    }

                    if (now()->startOfDay()->lte($oldestOverdueInvoice->due_date->startOfDay())) {
                        continue;
                    }

                    $hasOpenSuspension = $service->suspensions()
                        ->whereNull('unsuspended_at')
                        ->exists();

                    $service->forceFill([
                        'status' => Service::STATUS_SUSPENDED,
                        'suspended_at' => $service->suspended_at ?? now(),
                        'updated_at' => now(),
                    ])->save();

                    if (! $hasOpenSuspension) {
                        $service->suspensions()->create([
                            'tenant_id' => $service->tenant_id,
                            'user_id' => null,
                            'reason' => 'Suspended automatically due to overdue billing.',
                            'suspended_at' => now(),
                            'metadata' => [
                                'source' => 'billing_automation',
                                'subscription_id' => $subscription->id,
                            ],
                        ]);
                    }

                    $suspended++;
                }
            }, 'id');

        return $suspended;
    }
}
