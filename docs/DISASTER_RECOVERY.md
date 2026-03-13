# Disaster Recovery

This document defines Hostinvo recovery procedures for production incidents.

## Recovery Targets

- **RPO (data loss target):** 24 hours (daily backup baseline)
- **RTO (service restore target):** 2 hours

## 1. Database Restore (PostgreSQL)

1. Put application in maintenance mode:
   - `docker compose -f docker-compose.prod.yml exec -T app php artisan down`
2. Select latest valid dump from `${BACKUP_ROOT}/postgres/`.
3. Restore:

```bash
cat /var/backups/hostinvo/postgres/hostinvo_<timestamp>.dump | \
docker compose -f docker-compose.prod.yml exec -T postgres sh -lc \
"PGPASSWORD='${POSTGRES_PASSWORD}' pg_restore -U '${POSTGRES_USER}' -d '${POSTGRES_DB}' --clean --if-exists --no-owner --no-privileges"
```

4. Re-run safe migrations:
   - `docker compose -f docker-compose.prod.yml exec -T app php artisan migrate --force`

## 2. Cache Rebuild (Redis)

If Redis data is corrupted or unavailable:

1. Restart Redis:
   - `docker compose -f docker-compose.prod.yml restart redis`
2. Rebuild caches:
   - `docker compose -f docker-compose.prod.yml exec -T app php artisan optimize:clear`
   - `docker compose -f docker-compose.prod.yml exec -T app php artisan config:cache`
   - `docker compose -f docker-compose.prod.yml exec -T app php artisan route:cache`
   - `docker compose -f docker-compose.prod.yml exec -T app php artisan view:cache`
   - `docker compose -f docker-compose.prod.yml exec -T app php artisan event:cache`

## 3. Queue Restart Procedure

1. Restart queue services:
   - `docker compose -f docker-compose.prod.yml restart queue-worker scheduler`
2. Signal workers to reload:
   - `docker compose -f docker-compose.prod.yml exec -T app php artisan queue:restart`
3. Verify queue health endpoint:
   - `curl -fsS http://127.0.0.1/health/queue`

## 4. Storage Restore

1. Stop write traffic (maintenance mode).
2. Restore from latest archive in `${BACKUP_ROOT}/storage/`:

```bash
tar -xzf /var/backups/hostinvo/storage/storage_<timestamp>.tar.gz -C /opt/hostinvo/backend
```

3. Ensure symlink exists:
   - `docker compose -f docker-compose.prod.yml exec -T app php artisan storage:link --force`

## 5. Failover Procedure

1. Promote standby environment or fallback node.
2. Point upstream proxy/load balancer to healthy node.
3. Validate endpoints:
   - `/health`
   - `/health/database`
   - `/health/redis`
   - `/health/queue`
4. Keep old primary in read-only/quarantined state until postmortem is complete.

## 6. Return to Service

1. Bring app online:
   - `docker compose -f docker-compose.prod.yml exec -T app php artisan up`
2. Run smoke checks for:
   - login
   - tenant-scoped API calls
   - queue dispatch and processing
3. Announce incident resolution and start post-incident review.
