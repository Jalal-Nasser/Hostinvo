<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Provisioning\ImportPleskPlansRequest;
use App\Http\Requests\Provisioning\IndexPleskPlanImportRequest;
use App\Http\Resources\Catalog\ProductResource;
use App\Models\Server;
use App\Services\Provisioning\PleskPlanImportService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class PleskPlanImportController extends Controller
{
    public function index(
        IndexPleskPlanImportRequest $request,
        Server $server,
        PleskPlanImportService $imports,
    ): JsonResponse {
        return response()->json(
            $imports->previewPlans($server, $request->validated())
        );
    }

    public function store(
        ImportPleskPlansRequest $request,
        Server $server,
        PleskPlanImportService $imports,
    ): JsonResponse {
        $result = $imports->importPlans($server, $request->validated(), $request->user());

        return response()->json([
            'data' => [
                'products' => ProductResource::collection(collect($result['products']))->resolve(),
                'summary' => $result['summary'],
            ],
        ], Response::HTTP_CREATED);
    }
}
