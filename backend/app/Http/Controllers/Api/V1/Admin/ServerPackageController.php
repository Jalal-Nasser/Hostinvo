<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Provisioning\UpdateServerPackagesRequest;
use App\Http\Resources\Provisioning\ServerResource;
use App\Models\Server;
use App\Services\Provisioning\ServerManagementService;

class ServerPackageController extends Controller
{
    public function update(
        UpdateServerPackagesRequest $request,
        Server $server,
        ServerManagementService $serverManagementService
    ): ServerResource {
        return new ServerResource(
            $serverManagementService->syncServerPackages($server, $request->validated())
        );
    }
}
