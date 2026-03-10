<?php

namespace App\Queue\Failed;

use App\Support\Tenancy\CurrentTenant;
use DateTimeInterface;
use Illuminate\Database\ConnectionResolverInterface;
use Illuminate\Queue\Failed\DatabaseUuidFailedJobProvider;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Str;

class TenantAwareDatabaseUuidFailedJobProvider extends DatabaseUuidFailedJobProvider
{
    public function __construct(
        ConnectionResolverInterface $resolver,
        string $database,
        string $table,
        private readonly CurrentTenant $currentTenant,
    ) {
        parent::__construct($resolver, $database, $table);
    }

    /**
     * Log a failed job into storage with tenant context when available.
     *
     * @param  string  $connection
     * @param  string  $queue
     * @param  string  $payload
     * @param  \Throwable  $exception
     * @return string|null
     */
    public function log($connection, $queue, $payload, $exception)
    {
        $decodedPayload = json_decode($payload, true);
        $uuid = is_array($decodedPayload) && filled($decodedPayload['uuid'] ?? null)
            ? (string) $decodedPayload['uuid']
            : (string) Str::uuid();

        $tenantId = is_array($decodedPayload) && filled($decodedPayload['tenant_id'] ?? null)
            ? (string) $decodedPayload['tenant_id']
            : null;

        $this->getTable()->insert([
            'uuid' => $uuid,
            'tenant_id' => $tenantId,
            'connection' => $connection,
            'queue' => $queue,
            'payload' => $payload,
            'exception' => (string) mb_convert_encoding($exception, 'UTF-8'),
            'failed_at' => Date::now(),
        ]);

        return $uuid;
    }

    /**
     * Get a list of all of the failed jobs.
     *
     * @return array
     */
    public function all()
    {
        return $this->tenantScopedTable()->orderBy('id', 'desc')->get()->map(function ($record) {
            $record->id = $record->uuid;
            unset($record->uuid);

            return $record;
        })->all();
    }

    /**
     * Get a single failed job.
     *
     * @param  mixed  $id
     * @return object|null
     */
    public function find($id)
    {
        if ($record = $this->tenantScopedTable()->where('uuid', $id)->first()) {
            $record->id = $record->uuid;
            unset($record->uuid);
        }

        return $record;
    }

    /**
     * Delete a single failed job from storage.
     *
     * @param  mixed  $id
     * @return bool
     */
    public function forget($id)
    {
        return $this->tenantScopedTable()->where('uuid', $id)->delete() > 0;
    }

    /**
     * Get the IDs of all of the failed jobs.
     *
     * @param  string|null  $queue
     * @return array
     */
    public function ids($queue = null)
    {
        return $this->tenantScopedTable()
            ->when(! is_null($queue), fn ($query) => $query->where('queue', $queue))
            ->orderBy('id', 'desc')
            ->pluck('uuid')
            ->all();
    }

    /**
     * Flush all of the failed jobs from storage.
     *
     * @param  int|null  $hours
     * @return void
     */
    public function flush($hours = null)
    {
        $this->tenantScopedTable()->when($hours, function ($query, $hours) {
            $query->where('failed_at', '<=', Date::now()->subHours($hours));
        })->delete();
    }

    /**
     * Prune all of the entries older than the given date.
     *
     * @param  \DateTimeInterface  $before
     * @return int
     */
    public function prune(DateTimeInterface $before)
    {
        $query = $this->tenantScopedTable()->where('failed_at', '<', $before);

        $totalDeleted = 0;

        do {
            $deleted = $query->take(1000)->delete();

            $totalDeleted += $deleted;
        } while ($deleted !== 0);

        return $totalDeleted;
    }

    /**
     * Count the failed jobs.
     *
     * @param  string|null  $connection
     * @param  string|null  $queue
     * @return int
     */
    public function count($connection = null, $queue = null)
    {
        return $this->tenantScopedTable()
            ->when($connection, fn ($builder) => $builder->where('connection', $connection))
            ->when($queue, fn ($builder) => $builder->where('queue', $queue))
            ->count();
    }

    /**
     * Scope failed job queries to the active tenant when resolved.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    private function tenantScopedTable()
    {
        $query = $this->getTable();
        $tenantId = $this->currentTenant->id();

        if (filled($tenantId)) {
            $query->where('tenant_id', $tenantId);
        }

        return $query;
    }
}
