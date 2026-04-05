<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\UpdatePlatformPlansRequest;
use App\Models\License;
use App\Services\Platform\PlatformSettingService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class PlatformPlanController extends Controller
{
    public function index(PlatformSettingService $settings): JsonResponse
    {
        $user = request()->user();
        abort_unless($user?->hasRole('super_admin'), 403);

        $defaults = (array) config('licensing.plans', []);
        $overrides = $settings->get('licensing_plans', []);
        $pricingNote = $settings->get('pricing_note', ['value' => null]);

        $plans = [];

        foreach (License::plans() as $planKey) {
            $planDefaults = (array) ($defaults[$planKey] ?? []);
            $override = (array) ($overrides[$planKey] ?? []);
            $merged = array_replace($planDefaults, $override);

            $plans[] = [
                'key' => $planKey,
                'label' => (string) ($merged['label'] ?? ucfirst(str_replace('_', ' ', $planKey))),
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

    public function update(UpdatePlatformPlansRequest $request, PlatformSettingService $settings): JsonResponse
    {
        $payload = $request->validated();
        $plans = [];

        foreach ($payload['plans'] as $plan) {
            $plans[$plan['key']] = [
                'label' => $plan['label'],
                'monthly_price' => $plan['monthly_price'] ?? null,
                'max_clients' => $plan['max_clients'],
                'max_services' => $plan['max_services'] ?? null,
                'activation_limit' => $plan['activation_limit'] ?? null,
                'duration_days' => $plan['duration_days'] ?? null,
                'is_trial' => (bool) ($plan['is_trial'] ?? false),
            ];
        }

        $settings->put('licensing_plans', $plans);
        $settings->put('pricing_note', ['value' => $payload['pricing_note'] ?? null]);

        return response()->json([
            'message' => 'Plans updated.',
            'plans' => $plans,
            'pricing_note' => $payload['pricing_note'] ?? null,
        ], Response::HTTP_OK);
    }
}
