# CI/CD Environment Structure

This repository uses one GitHub Actions workflow:

- `.github/workflows/ci-cd.yml`

## Branch to Environment Mapping

| Git Branch | GitHub Environment | Image Tag Suffix |
|------------|--------------------|------------------|
| `develop` | `development` | `development-latest` |
| `staging` | `staging` | `staging-latest` |
| `main` | `production` | `production-latest` |

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
2. Start/update production services
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

## Required Runtime Variables on Deployment Host

In the deployment host's environment file (`backend/.env.production`):

- `APP_ENV`
- `APP_KEY`
- `DB_*` (PostgreSQL)
- `REDIS_*` (Redis)
- payment/mail/provider secrets

And in the compose environment:

- `APP_IMAGE`
- `NGINX_IMAGE`
