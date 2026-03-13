# Production Deployment

This runbook defines the production deployment procedure for Hostinvo (Laravel + PostgreSQL + Redis + Docker).

## 1. Environment Preparation

1. Copy and complete environment files:
   - `cp backend/.env.production.example backend/.env.production`
   - `cp .env.production.example .env.production`
2. Set strong secrets:
   - `APP_KEY`
   - `DB_PASSWORD`
   - `REDIS_PASSWORD`
   - payment and webhook secrets
3. Verify required host tooling:
   - Docker Engine + Docker Compose plugin
   - git
4. Ensure TLS is terminated by an upstream proxy and container nginx is not exposed directly to the public internet.

## 2. Docker Deployment

Use `docker-compose.prod.yml`:

```bash
docker compose -f docker-compose.prod.yml pull app nginx queue-worker scheduler
docker compose -f docker-compose.prod.yml up -d app nginx postgres redis queue-worker scheduler
```

## 3. Database Migration Procedure

```bash
docker compose -f docker-compose.prod.yml exec -T app php artisan migrate --force
```

If migration fails, stop rollout and use rollback procedure in [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md).

## 4. Cache Warmup Commands

```bash
docker compose -f docker-compose.prod.yml exec -T app php artisan optimize:clear
docker compose -f docker-compose.prod.yml exec -T app php artisan config:cache
docker compose -f docker-compose.prod.yml exec -T app php artisan route:cache
docker compose -f docker-compose.prod.yml exec -T app php artisan view:cache
docker compose -f docker-compose.prod.yml exec -T app php artisan event:cache
docker compose -f docker-compose.prod.yml exec -T app php artisan storage:link --force
```

## 5. Queue Worker Startup

Queue workers and scheduler are dedicated services:

```bash
docker compose -f docker-compose.prod.yml restart queue-worker scheduler
docker compose -f docker-compose.prod.yml exec -T app php artisan queue:restart
```

## 6. Monitoring Verification

Run after deployment:

```bash
curl -fsS http://127.0.0.1/health
curl -fsS http://127.0.0.1/health/database
curl -fsS http://127.0.0.1/health/redis
curl -fsS http://127.0.0.1/health/queue
```

Metrics endpoints exist and are protected by `metrics.auth`:
- `/metrics`
- `/metrics/json`

## 7. Backup Strategy Configuration

Configured via:
- `BACKUP_ROOT=/var/backups/hostinvo`
- `BACKUP_RETENTION_DAYS=30`
- `BACKUP_POSTGRES_ENABLED=true`
- `BACKUP_REDIS_ENABLED=true`
- `BACKUP_STORAGE_ENABLED=true`

Operational scripts:
- `scripts/deploy/prod-backup.sh`
- `scripts/deploy/prod-backup-prune.sh`

Recommended cron:

```cron
15 2 * * * /bin/bash /opt/hostinvo/scripts/deploy/prod-backup.sh
30 2 * * * /bin/bash /opt/hostinvo/scripts/deploy/prod-backup-prune.sh
```
