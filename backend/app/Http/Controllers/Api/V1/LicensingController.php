<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Licensing\ActivateLicenseRequest;
use App\Http\Requests\Licensing\ValidateLicenseRequest;
use App\Services\Licensing\LicenseService;
use Illuminate\Http\JsonResponse;

class LicensingController extends Controller
{
    public function validateLicense(
        ValidateLicenseRequest $request,
        LicenseService $licenseService,
    ): JsonResponse {
        return $this->success(
            $licenseService->validateLicense(
                $request->validated('license_key'),
                $request->validated('domain'),
                $request->validated('instance_id'),
            )
        );
    }

    public function activate(
        ActivateLicenseRequest $request,
        LicenseService $licenseService,
    ): JsonResponse {
        return $this->success(
            $licenseService->activateLicense(
                $request->validated('license_key'),
                $request->validated('domain'),
                $request->validated('instance_id'),
                $request->user()?->tenant_id,
            )
        );
    }
}
