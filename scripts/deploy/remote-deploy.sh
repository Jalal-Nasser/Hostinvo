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

cd "${DEPLOY_PATH}"

if [[ -n "${DEPLOY_BRANCH:-}" ]]; then
  git fetch origin "${DEPLOY_BRANCH}"
  git checkout "${DEPLOY_BRANCH}"
  git pull --ff-only origin "${DEPLOY_BRANCH}"
fi

docker compose -f docker-compose.prod.yml pull app nginx queue-worker scheduler
docker compose -f docker-compose.prod.yml up -d app nginx postgres redis queue-worker scheduler

docker compose -f docker-compose.prod.yml exec -T app php artisan migrate --force
docker compose -f docker-compose.prod.yml exec -T app php artisan config:cache
docker compose -f docker-compose.prod.yml exec -T app php artisan route:cache
docker compose -f docker-compose.prod.yml exec -T app php artisan view:cache
docker compose -f docker-compose.prod.yml exec -T app php artisan event:cache
docker compose -f docker-compose.prod.yml exec -T app php artisan queue:restart
docker compose -f docker-compose.prod.yml restart queue-worker scheduler
