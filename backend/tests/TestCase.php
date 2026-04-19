<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use PDO;

abstract class TestCase extends BaseTestCase
{
    private static bool $testingDatabasePrepared = false;

    protected function setUp(): void
    {
        $this->ensureTestingDatabaseExists();

        parent::setUp();
    }

    private function ensureTestingDatabaseExists(): void
    {
        if (self::$testingDatabasePrepared) {
            return;
        }

        if ((string) env('APP_ENV') !== 'testing' || (string) env('DB_CONNECTION') !== 'pgsql') {
            self::$testingDatabasePrepared = true;

            return;
        }

        $host = (string) env('DB_HOST', 'postgres');
        $port = (string) env('DB_PORT', '5432');
        $database = (string) env('DB_DATABASE', 'hostinvo_testing');
        $username = (string) env('DB_USERNAME', 'hostinvo');
        $password = (string) env('DB_PASSWORD', 'hostinvo');

        $pdo = new PDO(
            sprintf('pgsql:host=%s;port=%s;dbname=postgres', $host, $port),
            $username,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            ],
        );

        $statement = $pdo->prepare('SELECT 1 FROM pg_database WHERE datname = :database');
        $statement->execute([
            'database' => $database,
        ]);

        if (! $statement->fetchColumn()) {
            $quotedName = str_replace('"', '""', $database);
            $pdo->exec(sprintf('CREATE DATABASE "%s"', $quotedName));
        }

        self::$testingDatabasePrepared = true;
    }
}
