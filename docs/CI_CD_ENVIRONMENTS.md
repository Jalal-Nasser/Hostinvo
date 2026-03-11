# CI/CD Environment Structure

This repository uses one GitHub Actions workflow:

- `.github/workflows/ci-cd.yml`

## Branch to Environment Mapping

| Git Branch | GitHub Environment | Image Tag Suffix | Compose File |
|------------|--------------------|------------------|--------------|
| `develop` | `development` | `development-latest` | `docker-compose.prod.yml` |
| `staging` | `staging` | `staging-latest` | `docker-compose.staging.yml` |
| `main` | `production` | `production-latest` | `docker-compose.prod.yml` |

## CI Stages

1. Install backend dependencies (`composer install`)
2. PHP lint
3. PHP static analysis (PHPStan)
4. Unit tests
5. Feature tests
6. Build Docker images (`app`, `nginx`)
7. Push Docker images to GHCR

## CD Stage (Per Environment)

Deployment runs over SSH and executes:

1. Pull new Docker images
2. Start/update environment services using `DEPLOY_COMPOSE_FILE`
3. Run `php artisan migrate --force`
4. Warm caches:
   - `config:cache`
   - `route:cache`
   - `view:cache`
   - `event:cache`
5. Restart queue workers and scheduler

## Required Environment Secrets

Each GitHub environment (`development`, `staging`, `production`) must define:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_SSH_PORT`
- `DEPLOY_PATH`

Environment secrets are isolated by GitHub Environment. Staging deployments use only `staging` environment secrets and never reuse `production` secrets.

## Required Runtime Variables on Deployment Host

In the deployment host's environment file (`backend/.env.production` or `backend/.env.staging` based on compose file):

- `APP_ENV`
- `APP_KEY`
- `DB_*` (PostgreSQL)
- `REDIS_*` (Redis)
- payment/mail/provider secrets

And in the compose environment:

- `APP_IMAGE`
- `NGINX_IMAGE`
- `DEPLOY_COMPOSE_FILE` (`docker-compose.staging.yml` for `staging` branch, otherwise `docker-compose.prod.yml`)
