# Disaster Recovery Runbook

**Hostinvo — Laravel + PostgreSQL + Redis + Docker**
**Last updated:** Phase 25 — Production Launch

---

## Recovery Targets

| Target | Value | Notes |
|--------|-------|-------|
| RPO (data loss target) | 24 hours | Daily backup baseline |
| RTO (service restore target) | 2 hours | Single-node deployment |

---

## Incident Severity Levels

| Level | Definition | Response Time |
|-------|-----------|---------------|
| P1 — Critical | All tenants unable to use the platform | Immediate |
| P2 — High | Partial outage: auth, billing, or provisioning broken | < 30 min |
| P3 — Medium | Single feature or tenant affected | < 2 hours |
| P4 — Low | Degraded performance, non-blocking | Next business day |

For P1/P2 incidents, the release owner must be notified immediately.

---

## 1. Database Restore (PostgreSQL)

### 1.1 Enable Maintenance Mode
```bash
docker compose -f docker-compose.prod.yml exec -T app php artisan down
```

### 1.2 Select Backup File
```bash
ls -lth /var/backups/hostinvo/postgres/
# Select the latest valid .dump file
DUMP_FILE="/var/backups/hostinvo/postgres/hostinvo_<timestamp>.dump"
```

### 1.3 Restore to Database
```bash
cat "${DUMP_FILE}" | \
  docker compose -f docker-compose.prod.yml exec -T postgres sh -lc \
  "PGPASSWORD='${POSTGRES_PASSWORD}' pg_restore \
    -U '${POSTGRES_USER}' -d '${POSTGRES_DB}' \
    --clean --if-exists --no-owner --no-privileges"
```

### 1.4 Re-run Safe Migrations
```bash
docker compose -f docker-compose.prod.yml exec -T app php artisan migrate --force
```

### 1.5 Verify Restore
```bash
docker compose -f docker-compose.prod.yml exec -T app \
  php artisan tinker --execute="DB::select('SELECT COUNT(*) FROM tenants');"
```

