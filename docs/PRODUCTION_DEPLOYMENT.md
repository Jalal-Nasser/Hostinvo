# Production Deployment Runbook

**Hostinvo — Laravel + PostgreSQL + Redis + Next.js**
**Applies to:** `docker-compose.prod.yml` single-node deployment
**Last updated:** Phase 25 — Production Launch

---

## Table of Contents

1. [Pre-Deployment Requirements](#1-pre-deployment-requirements)
2. [Environment Preparation](#2-environment-preparation)
3. [Docker Deployment](#3-docker-deployment)
4. [Database Migration Procedure](#4-database-migration-procedure)
5. [Cache Warmup Commands](#5-cache-warmup-commands)
6. [Queue Worker Startup](#6-queue-worker-startup)
7. [Monitoring Verification](#7-monitoring-verification)
8. [Post-Deployment Smoke Tests](#8-post-deployment-smoke-tests)
9. [Backup Strategy](#9-backup-strategy)
10. [Rollback Procedure](#10-rollback-procedure)

---

## 1. Pre-Deployment Requirements

### Host System
- Ubuntu 22.04 LTS or later (recommended)
- Docker Engine 24+ with Compose plugin (`docker compose`)
- Git 2.40+
- Minimum: 2 vCPU, 4 GB RAM, 40 GB disk
- Outbound internet for image pulls (or configure private registry)

### Required DNS Records
| Record | Type | Value |
|--------|------|-------|
| `api.hostinvo.dev` | A | Server IP |
| `hostinvo.dev` | A / CNAME | Vercel project |
| `portal.hostinvo.dev` | A / CNAME | Vercel project |

### TLS Termination
TLS **must** be terminated upstream (Nginx, Caddy, Cloudflare, or AWS ALB).
The Docker nginx container listens on HTTP port 80 only.
Never expose port 80 directly to the internet without a TLS proxy.

### Firewall
- Only the TLS proxy needs access to Docker-exposed port 80.
- Block all other inbound traffic at host firewall level.
- SSH access: key-based only; password auth disabled.


---

## 2. Environment Preparation

### 2.1 Clone Repository
```bash
git clone git@github.com:your-org/hostinvo.git /opt/hostinvo
cd /opt/hostinvo
git checkout main
```

### 2.2 Backend Environment File
```bash
cp backend/.env.production.example backend/.env.production
chmod 600 backend/.env.production
```

Edit `backend/.env.production` and set **every** value marked `change-this`:

| Variable | Description |
|----------|-------------|
| `APP_KEY` | Generate: `php artisan key:generate --show` |
| `APP_URL` | `https://api.hostinvo.dev` |
| `FRONTEND_URL` | `https://portal.hostinvo.dev` |
| `MARKETING_URL` | `https://hostinvo.dev` |
| `PORTAL_URL` | `https://portal.hostinvo.dev` |
| `DB_PASSWORD` | Strong random password (min 32 chars) |
| `REDIS_PASSWORD` | Strong random password (min 32 chars) |
| `STRIPE_SECRET_KEY` | Live Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Live Stripe webhook signing secret |
| `PAYPAL_CLIENT_SECRET` | Live PayPal client secret |
| `PAYPAL_WEBHOOK_ID` | Live PayPal webhook ID |
| `MONITORING_METRICS_TOKEN` | Random token for `/metrics` auth |
| `MONITORING_ALERT_WEBHOOK_URL` | Slack/Teams webhook for alerts |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP credentials |
| `SESSION_DOMAIN` | `.hostinvo.dev` (leading dot = subdomain coverage) |

Security assertions — verify before proceeding:
```bash
grep "APP_DEBUG=false" backend/.env.production
grep "APP_ENV=production" backend/.env.production
grep "SESSION_SECURE_COOKIE=true" backend/.env.production
```

### 2.3 Root Environment File
```bash
cp .env.production.example .env.production
chmod 600 .env.production
```
Set `APP_IMAGE`, `NGINX_IMAGE`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`
to match the values in `backend/.env.production`.


---

## 3. Docker Deployment

### 3.1 Build or Pull Images
```bash
# First deploy or after code changes — build from source
docker compose -f docker-compose.prod.yml build app nginx

# Subsequent deploys — pull pre-built images from registry
docker compose -f docker-compose.prod.yml pull app nginx queue-worker scheduler
```

### 3.2 Start Infrastructure First
```bash
docker compose -f docker-compose.prod.yml up -d postgres redis
```
Wait until both show `(healthy)`:
```bash
docker compose -f docker-compose.prod.yml ps postgres redis
```

### 3.3 Start Application Services
```bash
docker compose -f docker-compose.prod.yml up -d app nginx queue-worker scheduler
```

### 3.4 Verify All Services
```bash
docker compose -f docker-compose.prod.yml ps
```
All services must show `Up (healthy)` or `Up`.
If any show `Exit` or `Restarting`, inspect logs before proceeding:
```bash
docker compose -f docker-compose.prod.yml logs --tail=100 <service-name>
```

---

## 4. Database Migration Procedure

### 4.1 Pre-Migration Backup
Always snapshot before migrating an existing installation:
```bash
bash scripts/deploy/prod-backup.sh
```

### 4.2 Run Migrations
```bash
docker compose -f docker-compose.prod.yml exec -T app php artisan migrate --force
```
`--force` is required in production. Migrations run in a transaction where supported.

### 4.3 Failure Protocol
If `artisan migrate --force` exits non-zero:
1. **Do not restart app traffic.**
2. Review the failing migration file and error output.
3. For additive changes only: fix and retry.
4. For destructive changes: restore from the pre-migration backup.
   See [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) — Section 1.

### 4.4 Verify All Migrations Applied
```bash
docker compose -f docker-compose.prod.yml exec -T app php artisan migrate:status | tail -20
```
All rows must show `Ran`.


---

## 5. Cache Warmup Commands

Run in this exact order after every deployment:
```bash
# Clear stale caches from previous deployment
docker compose -f docker-compose.prod.yml exec -T app php artisan optimize:clear

# Rebuild Laravel application caches
docker compose -f docker-compose.prod.yml exec -T app php artisan config:cache
docker compose -f docker-compose.prod.yml exec -T app php artisan route:cache
docker compose -f docker-compose.prod.yml exec -T app php artisan view:cache
docker compose -f docker-compose.prod.yml exec -T app php artisan event:cache

# Ensure public storage symlink exists
docker compose -f docker-compose.prod.yml exec -T app php artisan storage:link --force
```

Expected: each command prints `INFO ... cached successfully.` with no errors.

---

## 6. Queue Worker Startup

```bash
# Signal workers to gracefully reload (picks up new code)
docker compose -f docker-compose.prod.yml exec -T app php artisan queue:restart

# Restart the worker container for a clean process group
docker compose -f docker-compose.prod.yml restart queue-worker scheduler
```

### Verify Workers Active
```bash
docker compose -f docker-compose.prod.yml exec queue-worker supervisorctl status
```
Expected: all processes show `RUNNING`.

### Queue Tiers Reference
| Tier | Queue Name | Workers | Configured By |
|------|-----------|---------|---------------|
| Critical | `critical` | 2 | `QUEUE_WORKER_CRITICAL_PROCS` |
| Default | `default` | 2 | `QUEUE_WORKER_DEFAULT_PROCS` |
| Low | `low` | 1 | `QUEUE_WORKER_LOW_PROCS` |

---

## 7. Monitoring Verification

All must return HTTP 200 before opening traffic:
```bash
curl -fsS http://127.0.0.1/health
curl -fsS http://127.0.0.1/health/database
curl -fsS http://127.0.0.1/health/redis
curl -fsS http://127.0.0.1/health/queue

# Metrics endpoints (require token)
curl -fsS -H "Authorization: Bearer ${MONITORING_METRICS_TOKEN}" \
  http://127.0.0.1/metrics
curl -fsS -H "Authorization: Bearer ${MONITORING_METRICS_TOKEN}" \
  http://127.0.0.1/metrics/json
```

Expected health response shape:
```json
{
  "data": {
    "status": "ok",
    "timestamp": "2025-01-01T00:00:00+00:00",
    "checks": {
      "database": { "status": "ok" },
      "redis": { "status": "ok" },
      "queue": { "status": "ok" }
    }
  },
  "meta": {},
  "errors": []
}
```

Any `"status"` other than `"ok"` must be resolved before opening traffic.

Automated check: `bash scripts/deploy/prod-smoke-test.sh`


---

## 8. Post-Deployment Smoke Tests

| Test | Endpoint / Action | Expected |
|------|------------------|----------|
| Provider login | `POST /api/v1/auth/login` | 200 + token |
| Tenant-scoped read | `GET /api/v1/clients` with valid token | 200 + paginated list |
| Invoice listing | `GET /api/v1/invoices` | 200 |
| Queue dispatch | Create order that triggers provisioning | Job enqueued |
| Webhook acceptance | Stripe test webhook | 200 |
| Metrics auth failure | `GET /metrics` without token | 401 |
| Metrics auth success | `GET /metrics` with valid token | 200 + Prometheus text |

---

## 9. Backup Strategy

### 9.1 What Is Backed Up
| Asset | Method | Destination |
|-------|--------|-------------|
| PostgreSQL | `pg_dump -F c` (custom compressed) | `${BACKUP_ROOT}/postgres/` |
| Redis | `BGSAVE` → copy `dump.rdb` | `${BACKUP_ROOT}/redis/` |
| Laravel Storage | `tar -czf` archive | `${BACKUP_ROOT}/storage/` |

### 9.2 Retention Policy
- Daily backups retained for **30 days** (`BACKUP_RETENTION_DAYS`)
- Files older than the retention threshold are pruned by `prod-backup-prune.sh`
- For long-term archival, mirror `${BACKUP_ROOT}` to cold object storage (S3, Wasabi, B2)

### 9.3 Cron Schedule (host crontab)
```cron
# Daily backup — 02:15 UTC
15 2 * * * POSTGRES_PASSWORD='...' REDIS_PASSWORD='...' \
  /bin/bash /opt/hostinvo/scripts/deploy/prod-backup.sh \
  >> /var/log/hostinvo-backup.log 2>&1

# Prune old backups — 02:30 UTC
30 2 * * * /bin/bash /opt/hostinvo/scripts/deploy/prod-backup-prune.sh \
  >> /var/log/hostinvo-backup.log 2>&1
```

### 9.4 Backup Integrity Check (monthly)
```bash
pg_restore --list /var/backups/hostinvo/postgres/hostinvo_<latest>.dump
```

---

## 10. Rollback Procedure

```bash
# 1. Enable maintenance mode
docker compose -f docker-compose.prod.yml exec -T app php artisan down

# 2. Roll back to previous image tags
export APP_IMAGE=hostinvo-app:previous-tag
export NGINX_IMAGE=hostinvo-nginx:previous-tag
docker compose -f docker-compose.prod.yml up -d app nginx queue-worker scheduler

# 3. If migrations were destructive, restore database
#    See DISASTER_RECOVERY.md — Section 1

# 4. Rebuild caches for the reverted version
docker compose -f docker-compose.prod.yml exec -T app php artisan optimize:clear
docker compose -f docker-compose.prod.yml exec -T app php artisan config:cache
docker compose -f docker-compose.prod.yml exec -T app php artisan route:cache
docker compose -f docker-compose.prod.yml exec -T app php artisan view:cache

# 5. Restart workers
docker compose -f docker-compose.prod.yml exec -T app php artisan queue:restart
docker compose -f docker-compose.prod.yml restart queue-worker scheduler

# 6. Verify health, then bring app online
curl -fsS http://127.0.0.1/health
docker compose -f docker-compose.prod.yml exec -T app php artisan up
```

Full rollback runbook: [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md)
