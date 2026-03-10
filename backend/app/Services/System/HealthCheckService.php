<?php

namespace App\Services\System;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;
use Throwable;

class HealthCheckService
{
    public function overall(): array
    {
        $database = $this->database();
        $queue = $this->queue();
        $redis = $this->redis();

        $status = $database['status'] === 'ok'
            && $queue['status'] === 'ok'
            && $redis['status'] === 'ok'
                ? 'ok'
                : 'degraded';

        return [
            'status' => $status,
            'timestamp' => now()->toIso8601String(),
            'checks' => [
                'database' => $database,
                'queue' => $queue,
                'redis' => $redis,
            ],
        ];
    }

    public function database(): array
    {
        try {
            DB::connection()->select('select 1');

            return [
                'status' => 'ok',
                'connection' => config('database.default'),
            ];
        } catch (Throwable $exception) {
            return [
                'status' => 'fail',
                'connection' => config('database.default'),
                'message' => 'Database connectivity check failed.',
                'error' => $exception::class,
            ];
        }
    }

    public function queue(): array
    {
        $connectionName = (string) config('queue.default', 'redis');
        $queueNames = $this->resolveQueueNames($connectionName);

        try {
            $connection = Queue::connection($connectionName);
            $pending = [];

            if (method_exists($connection, 'size')) {
                foreach ($queueNames as $queueName) {
                    $pending[$queueName] = (int) $connection->size($queueName);
                }
            }

            return [
                'status' => 'ok',
                'connection' => $connectionName,
                'queues' => $queueNames,
                'pending' => $pending,
            ];
        } catch (Throwable $exception) {
            return [
                'status' => 'fail',
                'connection' => $connectionName,
                'queues' => $queueNames,
                'message' => 'Queue backend check failed.',
                'error' => $exception::class,
            ];
        }
    }

    public function redis(): array
    {
        try {
            $pingResult = Redis::connection()->ping();
            $healthy = $pingResult === true
                || (is_string($pingResult) && strcasecmp($pingResult, 'PONG') === 0);

            if (! $healthy) {
                return [
                    'status' => 'fail',
                    'connection' => (string) config('database.redis.client', 'phpredis'),
                    'message' => 'Redis ping returned an unexpected response.',
                ];
            }

            return [
                'status' => 'ok',
                'connection' => (string) config('database.redis.client', 'phpredis'),
            ];
        } catch (Throwable $exception) {
            return [
                'status' => 'fail',
                'connection' => (string) config('database.redis.client', 'phpredis'),
                'message' => 'Redis connectivity check failed.',
                'error' => $exception::class,
            ];
        }
    }

    /**
     * @return list<string>
     */
    private function resolveQueueNames(string $connectionName): array
    {
        $queueNames = [];

        foreach ((array) config('queue.tiers', []) as $tierConfig) {
            $queueName = $tierConfig['queue'] ?? null;

            if (! is_string($queueName) || $queueName === '') {
                continue;
            }

            $queueNames[$queueName] = $queueName;
        }

        if ($queueNames !== []) {
            return array_values($queueNames);
        }

        $defaultQueue = config("queue.connections.{$connectionName}.queue", 'default');

        return [is_string($defaultQueue) && $defaultQueue !== '' ? $defaultQueue : 'default'];
    }
}
