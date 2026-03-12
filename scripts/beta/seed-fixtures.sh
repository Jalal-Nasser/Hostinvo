#!/usr/bin/env bash

set -euo pipefail

COMPOSE_FILE="${1:-docker-compose.staging.yml}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "${REPO_ROOT}"

docker compose -f "${COMPOSE_FILE}" exec -T app php artisan db:seed --class='Database\Seeders\Beta\BetaFixtureSeeder' --force

