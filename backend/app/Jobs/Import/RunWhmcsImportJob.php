<?php

namespace App\Jobs\Import;

use App\Models\WhmcsImport;
use App\Services\Import\WhmcsMinimalImportService;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Throwable;

class RunWhmcsImportJob implements ShouldQueue, ShouldBeEncrypted
{
    use InteractsWithQueue;
    use Queueable;

    public int $tries = 1;

    /**
     * @param array{host:string,port:int,database:string,username:string,password?:string|null} $credentials
     */
    public function __construct(
        public readonly string $whmcsImportId,
        private readonly array $credentials,
    ) {
        $this->onQueue('default');
    }

    public function handle(WhmcsMinimalImportService $importer): void
    {
        $import = WhmcsImport::query()->with('tenant')->findOrFail($this->whmcsImportId);

        $import->update([
            'status' => WhmcsImport::STATUS_RUNNING,
            'message' => 'WHMCS import is running.',
        ]);

        Log::info('WHMCS import started.', [
            'whmcs_import_id' => $import->id,
            'tenant_id' => $import->tenant_id,
        ]);

        try {
            $summary = $importer->importFromCredentials($import->tenant, $this->credentials);

            $import->update([
                'status' => WhmcsImport::STATUS_COMPLETED,
                'message' => 'Import completed successfully',
            ]);

            Log::info('WHMCS import completed.', [
                'whmcs_import_id' => $import->id,
                'tenant_id' => $import->tenant_id,
                'summary' => $summary,
            ]);
        } catch (Throwable $exception) {
            $message = $this->failureMessage($exception);

            $import->update([
                'status' => WhmcsImport::STATUS_FAILED,
                'message' => $message,
            ]);

            Log::error('WHMCS import failed.', [
                'whmcs_import_id' => $import->id,
                'tenant_id' => $import->tenant_id,
                'exception' => $exception,
            ]);

            throw $exception;
        }
    }

    public function failed(Throwable $exception): void
    {
        WhmcsImport::query()
            ->whereKey($this->whmcsImportId)
            ->update([
                'status' => WhmcsImport::STATUS_FAILED,
                'message' => $this->failureMessage($exception),
            ]);
    }

    private function failureMessage(Throwable $exception): string
    {
        $message = $exception->getMessage();

        if (str_contains($message, 'SQLSTATE[HY000] [2002] No such file or directory')) {
            return 'Unable to connect to the WHMCS MySQL host. If WHMCS uses localhost, Docker Desktop must use host.docker.internal, or use the MySQL container/service hostname.';
        }

        if (str_contains($message, 'SQLSTATE[HY000] [2002] Network is unreachable')) {
            return 'Unable to reach the WHMCS MySQL host from Docker. Use a reachable hostname such as host.docker.internal for a Windows-hosted database, a Docker Compose service name, or the database server IP.';
        }

        return $message;
    }
}
