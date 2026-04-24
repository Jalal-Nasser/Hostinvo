<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Provisioning\ImportPleskSubscriptionsRequest;
use App\Http\Requests\Provisioning\IndexPleskImportRequest;
use App\Http\Resources\Provisioning\ServiceResource;
use App\Models\Server;
use App\Services\Provisioning\PleskImportService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class PleskSubscriptionImportController extends Controller
{
    public function index(
        IndexPleskImportRequest $request,
        Server $server,
        PleskImportService $imports,
    ): JsonResponse {
        return response()->json(
            $imports->previewSubscriptions($server, $request->validated())
        );
    }

    public function store(
        ImportPleskSubscriptionsRequest $request,
        Server $server,
        PleskImportService $imports,
    ): JsonResponse {
        $result = $imports->importSubscriptions($server, $request->validated(), $request->user());

        return response()->json([
            'data' => [
                'imported' => ServiceResource::collection(collect($result['imported']))->resolve(),
                'summary' => $result['summary'],
            ],
        ], Response::HTTP_CREATED);
    }
}
