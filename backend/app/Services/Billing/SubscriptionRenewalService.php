<?php

namespace App\Services\Billing;

use App\Models\ProductPricing;
use App\Models\Subscription;
use Carbon\Carbon;

class SubscriptionRenewalService
{
    public function renew(Subscription $subscription): void
    {
        $anchorDate = $subscription->next_billing_date
            ? Carbon::parse($subscription->next_billing_date)
            : now()->startOfDay();

        $nextBillingDate = match ($subscription->billing_cycle) {
            ProductPricing::CYCLE_MONTHLY => $anchorDate->copy()->addMonthNoOverflow(),
            ProductPricing::CYCLE_QUARTERLY => $anchorDate->copy()->addMonthsNoOverflow(3),
            ProductPricing::CYCLE_SEMIANNUALLY => $anchorDate->copy()->addMonthsNoOverflow(6),
            ProductPricing::CYCLE_ANNUALLY => $anchorDate->copy()->addYearNoOverflow(),
            ProductPricing::CYCLE_BIENNIALLY => $anchorDate->copy()->addYearsNoOverflow(2),
            ProductPricing::CYCLE_TRIENNIALLY => $anchorDate->copy()->addYearsNoOverflow(3),
            default => $anchorDate->copy()->addMonthNoOverflow(),
        };

        $subscription->forceFill([
            'last_billed_at' => now(),
            'next_billing_date' => $nextBillingDate->toDateString(),
        ])->save();
    }
}
