#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${DEPLOY_PATH:-}" ]]; then
  echo "DEPLOY_PATH is required."
  exit 1
fi

if [[ -z "${APP_IMAGE:-}" ]]; then
  echo "APP_IMAGE is required."
  exit 1
fi

if [[ -z "${NGINX_IMAGE:-}" ]]; then
  echo "NGINX_IMAGE is required."
  exit 1
fi

COMPOSE_FILE="${DEPLOY_COMPOSE_FILE:-docker-compose.prod.yml}"

cd "${DEPLOY_PATH}"

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "Compose file '${COMPOSE_FILE}' was not found in ${DEPLOY_PATH}."
  exit 1
fi

if [[ -n "${DEPLOY_BRANCH:-}" ]]; then
  git fetch origin "${DEPLOY_BRANCH}"
  git checkout "${DEPLOY_BRANCH}"
  git pull --ff-only origin "${DEPLOY_BRANCH}"
fi

docker compose -f "${COMPOSE_FILE}" pull app nginx queue-worker scheduler
docker compose -f "${COMPOSE_FILE}" up -d app nginx postgres redis queue-worker scheduler

docker compose -f "${COMPOSE_FILE}" exec -T app php artisan migrate --force
docker compose -f "${COMPOSE_FILE}" exec -T app php artisan config:cache
docker compose -f "${COMPOSE_FILE}" exec -T app php artisan route:cache
docker compose -f "${COMPOSE_FILE}" exec -T app php artisan view:cache
docker compose -f "${COMPOSE_FILE}" exec -T app php artisan storage:link --force
docker compose -f "${COMPOSE_FILE}" exec -T app php artisan event:cache
docker compose -f "${COMPOSE_FILE}" exec -T app php artisan queue:restart
docker compose -f "${COMPOSE_FILE}" restart queue-worker scheduler
