<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Import\StoreWhmcsImportRequest;
use App\Jobs\Import\RunWhmcsImportJob;
use App\Models\Tenant;
use App\Models\TenantSetting;
use App\Models\WhmcsImport;
use App\Support\Tenancy\CurrentTenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class WhmcsImportController extends Controller
{
    public function index(Request $request, CurrentTenant $currentTenant): JsonResponse
    {
        $this->authorize('viewAny', TenantSetting::class);

        $tenant = $this->resolveTenant($request, $currentTenant);

        if (! $tenant) {
            return $this->failure('WHMCS imports require an active tenant workspace.', Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $import = WhmcsImport::query()
            ->where('tenant_id', $tenant->id)
            ->latest()
            ->first();

        return $this->success([
            'import' => $import ? $this->serializeImport($import) : null,
        ]);
    }

    public function store(StoreWhmcsImportRequest $request, CurrentTenant $currentTenant): JsonResponse
    {
        $tenant = $this->resolveTenant($request, $currentTenant);

        if (! $tenant) {
            return $this->failure('WHMCS imports require an active tenant workspace.', Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $credentials = $request->safe()->only(['host', 'port', 'database', 'username', 'password']);
        $credentials['port'] = (int) $credentials['port'];

        $import = WhmcsImport::query()->create([
            'tenant_id' => $tenant->id,
            'status' => WhmcsImport::STATUS_PENDING,
            'message' => 'WHMCS import has been queued.',
        ]);

        RunWhmcsImportJob::dispatch($import->id, $credentials);

        return $this->success([
            'import' => $this->serializeImport($import),
            'message' => 'WHMCS import has been queued.',
        ], status: Response::HTTP_ACCEPTED);
    }

    private function resolveTenant(Request $request, CurrentTenant $currentTenant): ?Tenant
    {
        $tenantId = $request->input('tenant_id') ?: $currentTenant->id() ?: $request->user()?->tenant_id;

        if (! $tenantId) {
            return null;
        }

        return Tenant::query()->find($tenantId);
    }

    private function serializeImport(WhmcsImport $import): array
    {
        return [
            'id' => $import->id,
            'tenant_id' => $import->tenant_id,
            'status' => $import->status,
            'message' => $import->message,
            'created_at' => $import->created_at?->toJSON(),
            'updated_at' => $import->updated_at?->toJSON(),
        ];
    }
}
