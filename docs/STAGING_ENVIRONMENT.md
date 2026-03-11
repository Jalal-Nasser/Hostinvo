# Staging Environment

## Purpose

The staging environment validates deployment, infrastructure, and integration behavior before production releases.

It mirrors the production stack:
- Laravel (PHP-FPM) application container
- Nginx reverse proxy container
- PostgreSQL 16
- Redis 7
- queue worker container
- scheduler container

## Compose Configuration

Staging uses:
- `docker-compose.staging.yml`
- `backend/.env.staging`

Key runtime defaults:
- `APP_ENV=staging`
- `APP_DEBUG=false`
- dedicated staging PostgreSQL database (`hostinvo_staging`)
- dedicated staging Redis instance/password
- staging HTTP port mapping (`STAGING_APP_HTTP_PORT`, default `8081`)
- worker process counts tuned lower than production (`1/1/1`)

## CI/CD Integration

Branch mapping:
- `staging` branch -> GitHub `staging` environment -> image tag suffix `staging-latest`

Deployment behavior:
1. Workflow builds and pushes `staging-latest` app/nginx images.
2. Deploy step sends `DEPLOY_COMPOSE_FILE=docker-compose.staging.yml`.
3. Remote deploy script runs compose update, migrations, cache warmup, storage link, and worker restart.

## Staging Safety Rules

1. Real payment gateways are disabled by default in staging:
   - `PAYMENTS_STRIPE_ENABLED=false`
   - `PAYMENTS_PAYPAL_ENABLED=false`
2. If payment testing is needed, only sandbox credentials/endpoints are allowed.
3. Outgoing email sender name must be prefixed:
   - `MAIL_FROM_NAME="[STAGING] Hostinvo"`
4. Staging secrets are isolated from production secrets via separate GitHub Environment configuration.

## Monitoring and Health

Staging reuses the same health endpoints as production:
- `/health`
- `/health/database`
- `/health/redis`
- `/health/queue`

These endpoints are exposed through staging Nginx and can be used by uptime/monitoring checks.

## Staging Deployment Steps

1. Copy `backend/.env.staging.example` to `backend/.env.staging` and set real staging secrets.
2. Ensure host environment provides:
   - `APP_IMAGE`
   - `NGINX_IMAGE`
   - `DEPLOY_COMPOSE_FILE=docker-compose.staging.yml` (via CI)
3. Run deployment (automated through CI or manually):
   - `docker compose -f docker-compose.staging.yml pull app nginx queue-worker scheduler`
   - `docker compose -f docker-compose.staging.yml up -d app nginx postgres redis queue-worker scheduler`
   - `php artisan migrate --force`
   - cache warmup (`config:cache`, `route:cache`, `view:cache`, `event:cache`)
   - `php artisan storage:link --force`
   - `php artisan queue:restart`
