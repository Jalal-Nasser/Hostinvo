<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Provisioning\TestServerConnectionRequest;
use App\Models\Server;
use App\Services\Provisioning\ServerManagementService;
use Illuminate\Http\JsonResponse;

class ServerConnectionTestController extends Controller
{
    public function store(
        TestServerConnectionRequest $request,
        Server $server,
        ServerManagementService $serverManagementService
    ): JsonResponse {
        return $this->success(
            $serverManagementService->testServerConnection($server, $request->user())
        );
    }
}
