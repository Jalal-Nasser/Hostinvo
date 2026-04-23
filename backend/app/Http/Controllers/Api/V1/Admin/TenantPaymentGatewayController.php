<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payments\UpdatePaymentGatewaySettingsRequest;
use App\Models\TenantSetting;
use App\Services\Billing\PaymentGatewaySettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantPaymentGatewayController extends Controller
{
    public function show(Request $request, PaymentGatewaySettingsService $gateways): JsonResponse
    {
        $this->authorize('viewAny', TenantSetting::class);

        $tenant = $request->user()?->tenant;

        if (! $tenant) {
            return $this->failure('Payment gateway settings require an active tenant workspace.', 422);
        }

        return $this->success($gateways->forTenant($tenant));
    }

    public function update(
        UpdatePaymentGatewaySettingsRequest $request,
        PaymentGatewaySettingsService $gateways,
    ): JsonResponse {
        $this->authorize('create', TenantSetting::class);

        $tenant = $request->user()?->tenant;

        if (! $tenant) {
            return $this->failure('Payment gateway settings require an active tenant workspace.', 422);
        }

        return $this->success($gateways->update($tenant, $request->validated()));
    }
}
