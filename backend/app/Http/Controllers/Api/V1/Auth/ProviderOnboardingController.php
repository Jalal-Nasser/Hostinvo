<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterProviderRequest;
use App\Http\Requests\Auth\UpdateOnboardingCompanyRequest;
use App\Http\Resources\Auth\AuthenticatedUserResource;
use App\Services\Onboarding\ProviderOnboardingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ProviderOnboardingController extends Controller
{
    public function register(
        RegisterProviderRequest $request,
        ProviderOnboardingService $onboardingService,
    ): JsonResponse {
        $result = $onboardingService->registerProvider($request->validated(), $request);

        return $this->success([
            'user' => (new AuthenticatedUserResource($result['user']))->resolve($request),
            'license' => $result['license'],
        ], status: Response::HTTP_CREATED);
    }

    public function status(Request $request, ProviderOnboardingService $onboardingService): JsonResponse
    {
        return $this->success(
            $onboardingService->status($request->user())
        );
    }

    public function updateCompany(
        UpdateOnboardingCompanyRequest $request,
        ProviderOnboardingService $onboardingService,
    ): JsonResponse {
        $tenant = $onboardingService->updateCompany(
            $request->user(),
            $request->validated(),
        );

        return $this->success([
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'primary_domain' => $tenant->primary_domain,
                'default_locale' => $tenant->default_locale,
                'default_currency' => $tenant->default_currency,
                'timezone' => $tenant->timezone,
            ],
        ]);
    }
}
