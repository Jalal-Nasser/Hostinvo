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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

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

    public function test(StoreWhmcsImportRequest $request, CurrentTenant $currentTenant): JsonResponse
    {
        $tenant = $this->resolveTenant($request, $currentTenant);

        if (! $tenant) {
            return $this->failure('WHMCS imports require an active tenant workspace.', Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $credentials = $request->safe()->only(['host', 'port', 'database', 'username', 'password']);
        $credentials['port'] = (int) $credentials['port'];

        $connection = 'whmcs_test_'.Str::lower(Str::random(10));

        config()->set("database.connections.{$connection}", [
            'driver' => 'mysql',
            'host' => $credentials['host'],
            'port' => $credentials['port'],
            'database' => $credentials['database'],
            'username' => $credentials['username'],
            'password' => (string) ($credentials['password'] ?? ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => false,
            'engine' => null,
        ]);

        DB::purge($connection);

        try {
            $source = DB::connection($connection);
            $source->getPdo();

            $missingTables = collect(['tblclients', 'tblproductgroups', 'tblproducts', 'tblhosting'])
                ->reject(fn (string $table): bool => $source->getSchemaBuilder()->hasTable($table))
                ->values()
                ->all();

            if ($missingTables !== []) {
                return $this->failure(
                    'Connected to MySQL, but required WHMCS tables were not found.',
                    Response::HTTP_UNPROCESSABLE_ENTITY,
                    [[
                        'message' => 'Connected to MySQL, but required WHMCS tables were not found.',
                        'missing_tables' => $missingTables,
                    ]],
                );
            }

            return $this->success([
                'message' => 'Connection successful. Required WHMCS tables were found.',
            ]);
        } catch (Throwable $exception) {
            return $this->failure(
                $this->connectionFailureMessage($exception),
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        } finally {
            DB::disconnect($connection);
            config()->set("database.connections.{$connection}", null);
        }
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

    private function connectionFailureMessage(Throwable $exception): string
    {
        $message = $exception->getMessage();

        if (str_contains($message, 'SQLSTATE[HY000] [2002] Network is unreachable')) {
            return 'Unable to reach the WHMCS MySQL host from Docker. If the WHMCS file came from a remote server and says localhost, replace it with the remote MySQL host/IP or use an SSH tunnel.';
        }

        if (str_contains($message, 'SQLSTATE[HY000] [2002] No such file or directory')) {
            return 'Unable to connect to the WHMCS MySQL host. Localhost inside Docker is not your WHMCS server; use host.docker.internal, a Docker service name, or the remote DB host/IP.';
        }

        if (str_contains($message, 'SQLSTATE[HY000] [1045]')) {
            return 'WHMCS MySQL rejected the username or password.';
        }

        if (str_contains($message, 'SQLSTATE[HY000] [1049]')) {
            return 'The WHMCS database name was not found on that MySQL server.';
        }

        return $message;
    }
}
