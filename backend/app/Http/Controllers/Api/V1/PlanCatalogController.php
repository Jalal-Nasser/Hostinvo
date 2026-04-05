<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\License;
use App\Services\Platform\PlatformSettingService;
use Illuminate\Http\JsonResponse;

class PlanCatalogController extends Controller
{
    public function __invoke(PlatformSettingService $settings): JsonResponse
    {
        $defaults = (array) config('licensing.plans', []);
        $overrides = $settings->get('licensing_plans', []);
        $pricingNote = $settings->get('pricing_note', ['value' => null]);

        $plans = [];
        $overrideMap = [];

        foreach ($overrides as $override) {
            if (is_array($override) && isset($override['key'])) {
                $overrideMap[$override['key']] = $override;
            }
        }

        foreach (License::plans() as $planKey) {
            $planDefaults = (array) ($defaults[$planKey] ?? []);
            $override = (array) ($overrideMap[$planKey] ?? []);
            $merged = array_replace($planDefaults, $override);

            $plans[] = [
                'key' => $planKey,
                'label' => (string) ($merged['label'] ?? ucfirst(str_replace('_', ' ', $planKey))),
                'marketing_name' => $merged['marketing_name'] ?? null,
                'description' => $merged['description'] ?? null,
                'features' => $merged['features'] ?? [],
                'monthly_price' => $merged['monthly_price'] ?? null,
                'max_clients' => (int) ($merged['max_clients'] ?? 0),
                'max_services' => (int) ($merged['max_services'] ?? 0),
                'activation_limit' => (int) ($merged['activation_limit'] ?? 0),
                'duration_days' => $merged['duration_days'] ?? null,
                'is_trial' => (bool) ($merged['is_trial'] ?? false),
            ];
        }

        return response()->json([
            'pricing_note' => $pricingNote['value'] ?? null,
            'plans' => $plans,
        ]);
    }
}
