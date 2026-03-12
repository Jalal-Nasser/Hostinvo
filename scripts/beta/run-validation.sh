#!/usr/bin/env bash

set -euo pipefail

COMPOSE_FILE="docker-compose.staging.yml"
SEED_FIXTURES="false"
JSON_OUTPUT="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --compose-file)
      COMPOSE_FILE="${2:-}"
      shift 2
      ;;
    --seed)
      SEED_FIXTURES="true"
      shift
      ;;
    --json)
      JSON_OUTPUT="true"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--compose-file docker-compose.staging.yml] [--seed] [--json]"
      exit 1
      ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${REPO_ROOT}"

ARTISAN_ARGS=("exec" "-T" "app" "php" "artisan" "hostinvo:beta-validate")

if [[ "${SEED_FIXTURES}" == "true" ]]; then
  ARTISAN_ARGS+=("--seed")
fi

if [[ "${JSON_OUTPUT}" == "true" ]]; then
  ARTISAN_ARGS+=("--json")
fi

docker compose -f "${COMPOSE_FILE}" "${ARTISAN_ARGS[@]}"

