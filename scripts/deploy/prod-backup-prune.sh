#!/usr/bin/env bash

set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/hostinvo}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

if [[ ! -d "${BACKUP_ROOT}" ]]; then
  echo "Backup directory does not exist: ${BACKUP_ROOT}"
  exit 0
fi

find "${BACKUP_ROOT}/postgres" -type f -mtime +"${BACKUP_RETENTION_DAYS}" -delete 2>/dev/null || true
find "${BACKUP_ROOT}/redis" -type f -mtime +"${BACKUP_RETENTION_DAYS}" -delete 2>/dev/null || true
find "${BACKUP_ROOT}/storage" -type f -mtime +"${BACKUP_RETENTION_DAYS}" -delete 2>/dev/null || true

echo "Pruned backups older than ${BACKUP_RETENTION_DAYS} days from ${BACKUP_ROOT}."
