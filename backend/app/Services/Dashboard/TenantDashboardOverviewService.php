<?php

namespace App\Services\Dashboard;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ProvisioningJob;
use App\Models\Service;
use App\Models\Ticket;
use App\Models\Transaction;
use App\Models\User;
use App\Support\Tenancy\CurrentTenant;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
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
