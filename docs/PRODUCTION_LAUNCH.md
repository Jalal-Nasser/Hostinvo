# Production Launch

> **Phase 25 — Official Go-Live Document**
> Hostinvo · Laravel + PostgreSQL + Redis + Next.js · Multi-Tenant SaaS

This document governs the official production launch of Hostinvo.
It is the final gate before the platform is open to paying customers.

---

## 1. Go-Live Checklist

Complete all items. Each must be verified by a human, not assumed.

### 1.1 Infrastructure

- [ ] docker-compose.prod.yml services are all healthy (docker compose ps)
- [ ] Upstream TLS proxy is active and serving HTTPS
- [ ] APP_URL uses https:// in backend/.env.production
- [ ] DNS A record points to production server
- [ ] Port 443 is open on the host firewall
- [ ] Port 5432 (PostgreSQL) is NOT publicly exposed
- [ ] Port 6379 (Redis) is NOT publicly exposed

### 1.2 Application Configuration

- [ ] APP_ENV=production
- [ ] APP_DEBUG=false
- [ ] APP_KEY is set and non-default
- [ ] DB_PASSWORD is strong and non-default
- [ ] REDIS_PASSWORD is strong and non-default
- [ ] METRICS_AUTH_TOKEN is set and non-default
- [ ] MAIL_* credentials are production SMTP values
- [ ] Payment gateway credentials are in LIVE mode (not sandbox)

### 1.3 Database

- [ ] Migrations executed with --force (php artisan migrate --force)
- [ ] php artisan migrate:status shows no pending migrations
- [ ] Pre-deploy database backup was taken and verified

### 1.4 Cache and Workers

- [ ] Cache warmup complete (config, route, view, event)
- [ ] storage:link --force executed and symlink verified
- [ ] Queue worker container is running and processing jobs
- [ ] Scheduler container is running
