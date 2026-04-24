<?php

namespace App\Services\Dashboard;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ProvisioningJob;
use App\Models\ProvisioningLog;
use App\Models\Server;
use App\Models\Service;
use App\Models\Ticket;
use App\Models\Transaction;
use App\Models\User;
use App\Support\Tenancy\CurrentTenant;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TenantDashboardOverviewService
{
    public function __construct(
        private readonly CurrentTenant $currentTenant,
    ) {
    }

    public function build(?User $actor = null): array
    {
        $tenant = $this->currentTenant->tenant();

        if (! $tenant) {
            throw ValidationException::withMessages([
                'tenant' => ['An active tenant workspace is required for dashboard reporting.'],
            ]);
        }

        $timezone = $tenant->timezone ?: config('app.timezone', 'UTC');
        $currency = $tenant->default_currency ?: 'USD';
        $now = CarbonImmutable::now($timezone);

        return [
            'tenant' => [
                'id' => $tenant->getKey(),
                'name' => $tenant->name,
                'timezone' => $timezone,
                'currency' => $currency,
            ],
            'counters' => [
                'pending_orders' => Order::query()
                    ->where('status', Order::STATUS_PENDING)
                    ->count(),
                'tickets_waiting' => Ticket::query()
                    ->where(function ($query): void {
                        $query->whereNull('status_id')
                            ->orWhereHas('status', fn ($statusQuery) => $statusQuery->where('is_closed', false));
                    })
                    ->count(),
                'pending_cancellations' => Service::query()
                    ->whereNotNull('termination_date')
                    ->where('status', '!=', Service::STATUS_TERMINATED)
                    ->count(),
                'pending_module_actions' => ProvisioningJob::query()
                    ->whereIn('status', [
                        ProvisioningJob::STATUS_QUEUED,
                        ProvisioningJob::STATUS_PROCESSING,
                    ])
                    ->count(),
            ],
            'billing' => [
                'currency' => $currency,
                'today_minor' => $this->sumCompletedPaymentsBetween(
                    $now->startOfDay(),
                    $now->endOfDay(),
                ),
                'this_month_minor' => $this->sumCompletedPaymentsBetween(
                    $now->startOfMonth(),
                    $now->endOfMonth(),
                ),
                'this_year_minor' => $this->sumCompletedPaymentsBetween(
                    $now->startOfYear(),
                    $now->endOfYear(),
                ),
                'all_time_minor' => $this->sumCompletedPaymentsBetween(),
            ],
            'automation' => [
                'invoices_created_today' => Invoice::query()
                    ->where(function ($query) use ($now): void {
                        $query->whereDate('issue_date', $now->toDateString())
                            ->orWhere(function ($fallbackQuery) use ($now): void {
                                $fallbackQuery->whereNull('issue_date')
                                    ->whereDate('created_at', $now->toDateString());
                            });
                    })
                    ->count(),
                'credit_card_captures_today' => Transaction::query()
                    ->where('type', Transaction::TYPE_PAYMENT)
                    ->where('status', Transaction::STATUS_COMPLETED)
                    ->whereIn('gateway', ['stripe', 'paypal'])
                    ->where(function ($query) use ($now): void {
                        $query->whereDate('occurred_at', $now->toDateString())
                            ->orWhere(function ($fallbackQuery) use ($now): void {
                                $fallbackQuery->whereNull('occurred_at')
                                    ->whereDate('created_at', $now->toDateString());
                            });
                    })
                    ->count(),
            ],
            'support' => [
                'awaiting_reply' => Ticket::query()
                    ->where(function ($query): void {
                        $query->whereNull('status_id')
                            ->orWhereHas('status', fn ($statusQuery) => $statusQuery->where('is_closed', false));
                    })
                    ->where(function ($query): void {
                        $query->whereNull('last_reply_by')
                            ->orWhere('last_reply_by', Ticket::REPLY_BY_CLIENT);
                    })
                    ->count(),
                'assigned_to_you' => $actor
                    ? Ticket::query()
                        ->where('assigned_to_user_id', $actor->id)
                        ->where(function ($query): void {
                            $query->whereNull('status_id')
                                ->orWhereHas('status', fn ($statusQuery) => $statusQuery->where('is_closed', false));
                        })
                        ->count()
                    : 0,
            ],
            'client_activity' => [
                'active_clients' => Client::query()
                    ->where('status', Client::STATUS_ACTIVE)
                    ->count(),
                'users_online_last_hour' => User::query()
                    ->where('is_active', true)
                    ->where('last_login_at', '>=', $now->subHour()->utc())
                    ->count(),
                'recent_clients' => Client::query()
                    ->latest()
                    ->limit(5)
                    ->get()
                    ->map(fn (Client $client): array => [
                        'id' => $client->id,
                        'display_name' => $client->display_name,
                        'email' => $client->email,
                        'status' => $client->status,
                    ])
                    ->values()
                    ->all(),
            ],
            'servers' => [
                'connected_total' => Server::query()->count(),
                'active_total' => Server::query()->where('status', Server::STATUS_ACTIVE)->count(),
                'needs_attention_total' => Server::query()
                    ->whereIn('status', [Server::STATUS_INACTIVE, Server::STATUS_MAINTENANCE])
                    ->count(),
                'items' => Server::query()
                    ->latest()
                    ->limit(6)
                    ->get()
                    ->map(fn (Server $server): array => [
                        'id' => $server->id,
                        'name' => $server->name,
                        'hostname' => $server->hostname,
                        'ip_address' => $server->ip_address,
                        'panel_type' => $server->panel_type,
                        'status' => $server->status,
                        'has_credentials' => filled($server->credentials),
                        'last_tested_at' => optional($server->last_tested_at)?->toIso8601String(),
                        'current_accounts' => $server->current_accounts,
                        'max_accounts' => $server->max_accounts,
                    ])
                    ->values()
                    ->all(),
            ],
            'system_health' => $this->buildSystemHealthPayload(),
            'staff_online' => [
                'count' => User::query()
                    ->where('is_active', true)
                    ->where('last_login_at', '>=', $now->subMinutes(15)->utc())
                    ->count(),
                'items' => User::query()
                    ->where('is_active', true)
                    ->where('last_login_at', '>=', $now->subMinutes(15)->utc())
                    ->latest('last_login_at')
                    ->limit(5)
                    ->get()
                    ->map(fn (User $user): array => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'last_login_at' => optional($user->last_login_at)?->toIso8601String(),
                    ])
                    ->values()
                    ->all(),
            ],
            'activity' => $this->buildRecentActivity(),
            'chart' => [
                'default_period' => 'last_30_days',
                'series' => [
                    'today' => $this->buildTodaySeries($now),
                    'last_30_days' => $this->buildLastThirtyDaysSeries($now),
                    'last_year' => $this->buildLastYearSeries($now),
                ],
            ],
        ];
    }

    private function sumCompletedPaymentsBetween(
        ?CarbonImmutable $start = null,
        ?CarbonImmutable $end = null,
    ): int {
        $query = Payment::query()
            ->where('type', Payment::TYPE_PAYMENT)
            ->where('status', Payment::STATUS_COMPLETED);

        if ($start && $end) {
            $query->whereBetween('paid_at', [
                $start->utc(),
                $end->utc(),
            ]);
        }

        return (int) $query->sum('amount_minor');
    }

    private function buildSystemHealthPayload(): array
    {
        $overdueInvoices = Invoice::query()->where('status', Invoice::STATUS_OVERDUE)->count();
        $failedJobs = ProvisioningJob::query()->where('status', ProvisioningJob::STATUS_FAILED)->count();
        $failedServices = Service::query()->where('status', Service::STATUS_FAILED)->count();
        $inactiveServers = Server::query()->where('status', Server::STATUS_INACTIVE)->count();

        $maintenanceServers = Server::query()->where('status', Server::STATUS_MAINTENANCE)->count();
        $queuedJobs = ProvisioningJob::query()
            ->whereIn('status', [ProvisioningJob::STATUS_QUEUED, ProvisioningJob::STATUS_PROCESSING])
            ->count();
        $suspendedServices = Service::query()->where('status', Service::STATUS_SUSPENDED)->count();

        $attentionCount = $overdueInvoices + $failedJobs + $failedServices + $inactiveServers;
        $warningCount = $maintenanceServers + $queuedJobs + $suspendedServices;

        $rating = 'good';
        if ($attentionCount > 0) {
            $rating = 'attention';
        } elseif ($warningCount > 0) {
            $rating = 'warning';
        }

        $score = max(0, min(100, 100 - ($attentionCount * 15) - ($warningCount * 5)));

        return [
            'rating' => $rating,
            'score' => $score,
            'warnings' => $warningCount,
            'needs_attention' => $attentionCount,
        ];
    }

    private function buildRecentActivity(): array
    {
        $items = collect();

        foreach (ProvisioningLog::query()->latest('occurred_at')->limit(5)->get() as $log) {
            $items->push([
                'type' => 'system',
                'title' => 'Provisioning',
                'message' => Str::limit($log->message, 120),
                'occurred_at' => optional($log->occurred_at ?? $log->created_at)?->toIso8601String(),
            ]);
        }

        foreach (Invoice::query()->latest()->limit(5)->get() as $invoice) {
            $items->push([
                'type' => 'billing',
                'title' => 'Invoice',
                'message' => 'Invoice '.$invoice->reference_number.' recorded',
                'occurred_at' => optional($invoice->created_at)?->toIso8601String(),
            ]);
        }

        foreach (Payment::query()->latest('paid_at')->limit(5)->get() as $payment) {
            $reference = $payment->reference ?: $payment->id;
            $items->push([
                'type' => 'payment',
                'title' => 'Payment',
                'message' => 'Payment '.$reference.' recorded',
                'occurred_at' => optional($payment->paid_at ?? $payment->created_at)?->toIso8601String(),
            ]);
        }

        foreach (Ticket::query()->latest('created_at')->limit(5)->get() as $ticket) {
            $items->push([
                'type' => 'support',
                'title' => 'Ticket',
                'message' => 'Ticket '.$ticket->ticket_number.' opened',
                'occurred_at' => optional($ticket->created_at)?->toIso8601String(),
            ]);
        }

        return $items
            ->filter(fn (array $item): bool => filled($item['occurred_at'] ?? null))
            ->sortByDesc('occurred_at')
            ->take(8)
            ->values()
            ->all();
    }

    private function buildTodaySeries(CarbonImmutable $now): array
    {
        $start = $now->startOfDay();
        $end = $now->endOfDay();
        $orderSeries = $this->orderCountsByBucket($start, $end, 'Y-m-d H:00');
        $activationSeries = $this->serviceActivationCountsByBucket($start, $end, 'Y-m-d H:00');
        $incomeSeries = $this->incomeByBucket($start, $end, 'Y-m-d H:00');

        $points = [];

        for ($hour = 0; $hour < 24; $hour++) {
            $bucket = $start->addHours($hour);
            $key = $bucket->format('Y-m-d H:00');
            $points[] = [
                'bucket' => $key,
                'label' => $bucket->format('H:i'),
                'new_orders' => $orderSeries[$key] ?? 0,
                'activated_orders' => $activationSeries[$key] ?? 0,
                'income_minor' => $incomeSeries[$key] ?? 0,
            ];
        }

        return $points;
    }

    private function buildLastThirtyDaysSeries(CarbonImmutable $now): array
    {
        $start = $now->subDays(29)->startOfDay();
        $end = $now->endOfDay();
        $orderSeries = $this->orderCountsByBucket($start, $end, 'Y-m-d');
        $activationSeries = $this->serviceActivationCountsByBucket($start, $end, 'Y-m-d');
        $incomeSeries = $this->incomeByBucket($start, $end, 'Y-m-d');

        $points = [];

        for ($offset = 0; $offset < 30; $offset++) {
            $bucket = $start->addDays($offset);
            $key = $bucket->format('Y-m-d');
            $points[] = [
                'bucket' => $key,
                'label' => $bucket->format('j M'),
                'new_orders' => $orderSeries[$key] ?? 0,
                'activated_orders' => $activationSeries[$key] ?? 0,
                'income_minor' => $incomeSeries[$key] ?? 0,
            ];
        }

        return $points;
    }

    private function buildLastYearSeries(CarbonImmutable $now): array
    {
        $start = $now->subMonths(11)->startOfMonth();
        $end = $now->endOfMonth();
        $orderSeries = $this->orderCountsByBucket($start, $end, 'Y-m');
        $activationSeries = $this->serviceActivationCountsByBucket($start, $end, 'Y-m');
        $incomeSeries = $this->incomeByBucket($start, $end, 'Y-m');

        $points = [];

        for ($offset = 0; $offset < 12; $offset++) {
            $bucket = $start->addMonths($offset);
            $key = $bucket->format('Y-m');
            $points[] = [
                'bucket' => $key,
                'label' => $bucket->format('M Y'),
                'new_orders' => $orderSeries[$key] ?? 0,
                'activated_orders' => $activationSeries[$key] ?? 0,
                'income_minor' => $incomeSeries[$key] ?? 0,
            ];
        }

        return $points;
    }

    /**
     * @return array<string, int>
     */
    private function orderCountsByBucket(
        CarbonImmutable $start,
        CarbonImmutable $end,
        string $bucketFormat,
    ): array {
        $orders = Order::query()
            ->select(['placed_at', 'created_at'])
            ->where(function ($query) use ($start, $end): void {
                $query->whereBetween('placed_at', [$start->utc(), $end->utc()])
                    ->orWhere(function ($fallbackQuery) use ($start, $end): void {
                        $fallbackQuery->whereNull('placed_at')
                            ->whereBetween('created_at', [$start->utc(), $end->utc()]);
                    });
            })
            ->get();

        return $this->countBuckets(
            $orders,
            fn (Order $order): ?CarbonImmutable => $this->asTenantTime(
                $order->placed_at ?? $order->created_at
            ),
            $bucketFormat,
        );
    }

    /**
     * @return array<string, int>
     */
    private function serviceActivationCountsByBucket(
        CarbonImmutable $start,
        CarbonImmutable $end,
        string $bucketFormat,
    ): array {
        $services = Service::query()
            ->select(['activated_at'])
            ->whereNotNull('activated_at')
            ->whereBetween('activated_at', [$start->utc(), $end->utc()])
            ->get();

        return $this->countBuckets(
            $services,
            fn (Service $service): ?CarbonImmutable => $this->asTenantTime($service->activated_at),
            $bucketFormat,
        );
    }

    /**
     * @return array<string, int>
     */
    private function incomeByBucket(
        CarbonImmutable $start,
        CarbonImmutable $end,
        string $bucketFormat,
    ): array {
        $payments = Payment::query()
            ->select(['amount_minor', 'paid_at'])
            ->where('type', Payment::TYPE_PAYMENT)
            ->where('status', Payment::STATUS_COMPLETED)
            ->whereNotNull('paid_at')
            ->whereBetween('paid_at', [$start->utc(), $end->utc()])
            ->get();

        return $this->sumBuckets(
            $payments,
            fn (Payment $payment): ?CarbonImmutable => $this->asTenantTime($payment->paid_at),
            fn (Payment $payment): int => (int) $payment->amount_minor,
            $bucketFormat,
        );
    }

    /**
     * @template TModel of mixed
     *
     * @param  Collection<int, TModel>  $items
     * @param  callable(TModel): ?CarbonImmutable  $timestampResolver
     * @return array<string, int>
     */
    private function countBuckets(
        Collection $items,
        callable $timestampResolver,
        string $bucketFormat,
    ): array {
        $counts = [];

        foreach ($items as $item) {
            $timestamp = $timestampResolver($item);

            if (! $timestamp) {
                continue;
            }

            $bucket = $timestamp->format($bucketFormat);
            $counts[$bucket] = ($counts[$bucket] ?? 0) + 1;
        }

        return $counts;
    }

    /**
     * @template TModel of mixed
     *
     * @param  Collection<int, TModel>  $items
     * @param  callable(TModel): ?CarbonImmutable  $timestampResolver
     * @param  callable(TModel): int  $valueResolver
     * @return array<string, int>
     */
    private function sumBuckets(
        Collection $items,
        callable $timestampResolver,
        callable $valueResolver,
        string $bucketFormat,
    ): array {
        $totals = [];

        foreach ($items as $item) {
            $timestamp = $timestampResolver($item);

            if (! $timestamp) {
                continue;
            }

            $bucket = $timestamp->format($bucketFormat);
            $totals[$bucket] = ($totals[$bucket] ?? 0) + $valueResolver($item);
        }

        return $totals;
    }

    private function asTenantTime(mixed $value): ?CarbonImmutable
    {
        if (! $value) {
            return null;
        }

        $timezone = $this->currentTenant->tenant()?->timezone ?: config('app.timezone', 'UTC');

        return CarbonImmutable::instance($value)->setTimezone($timezone);
    }
}
