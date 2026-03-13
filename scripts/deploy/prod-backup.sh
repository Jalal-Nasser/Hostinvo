#!/usr/bin/env bash

set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/hostinvo}"
BACKUP_POSTGRES_ENABLED="${BACKUP_POSTGRES_ENABLED:-true}"
BACKUP_REDIS_ENABLED="${BACKUP_REDIS_ENABLED:-true}"
BACKUP_STORAGE_ENABLED="${BACKUP_STORAGE_ENABLED:-true}"

POSTGRES_DB="${POSTGRES_DB:-hostinvo}"
POSTGRES_USER="${POSTGRES_USER:-hostinvo}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-change-this}"
REDIS_PASSWORD="${REDIS_PASSWORD:-change-this}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "${BACKUP_ROOT}/postgres" "${BACKUP_ROOT}/redis" "${BACKUP_ROOT}/storage"

cd "${PROJECT_ROOT}"

if [[ "${BACKUP_POSTGRES_ENABLED}" == "true" ]]; then
  echo "Creating PostgreSQL backup..."
  docker compose -f "${COMPOSE_FILE}" exec -T postgres sh -lc \
    "PGPASSWORD='${POSTGRES_PASSWORD}' pg_dump -U '${POSTGRES_USER}' -d '${POSTGRES_DB}' -F c -Z 9" \
    > "${BACKUP_ROOT}/postgres/hostinvo_${TIMESTAMP}.dump"
fi

if [[ "${BACKUP_REDIS_ENABLED}" == "true" ]]; then
  echo "Creating Redis snapshot backup..."
  docker compose -f "${COMPOSE_FILE}" exec -T redis sh -lc \
    "redis-cli -a '${REDIS_PASSWORD}' BGSAVE || redis-cli BGSAVE"
  sleep 5
  docker compose -f "${COMPOSE_FILE}" cp \
    redis:/data/dump.rdb "${BACKUP_ROOT}/redis/redis_${TIMESTAMP}.rdb"
fi

if [[ "${BACKUP_STORAGE_ENABLED}" == "true" ]]; then
  echo "Creating storage backup archive..."
  tar -czf "${BACKUP_ROOT}/storage/storage_${TIMESTAMP}.tar.gz" \
    -C "${PROJECT_ROOT}/backend" storage
fi

echo "Backup completed at ${TIMESTAMP}."
