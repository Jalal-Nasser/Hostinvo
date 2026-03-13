# Production Launch

This checklist governs Hostinvo go-live for the first commercial production launch.

## 1. Go-Live Checklist

- [ ] `backend/.env.production` and `.env.production` are complete with production-only secrets
- [ ] `APP_ENV=production` and `APP_DEBUG=false`
- [ ] PostgreSQL and Redis passwords are non-default and rotated
- [ ] `docker-compose.prod.yml` services are healthy
- [ ] Migrations executed with `--force`
- [ ] Cache warmup complete (`config`, `route`, `view`, `event`)
- [ ] `storage:link --force` executed
- [ ] Queue worker and scheduler running
- [ ] Health endpoints return success:
  - `/health`
  - `/health/database`
  - `/health/redis`
  - `/health/queue`
- [ ] Metrics endpoints reachable with token:
  - `/metrics`
  - `/metrics/json`
- [ ] Backup scripts and retention cron enabled
- [ ] Stripe/PayPal live mode intentionally verified (or disabled for phased rollout)

## 2. Rollout Strategy

1. Deploy during low-traffic window.
2. Use rolling service startup order:
   - postgres/redis
   - app/nginx
   - queue-worker/scheduler
3. Run post-deploy smoke tests:
   - tenant auth
   - invoice read and payment flow
   - queue dispatch + processing
   - webhook endpoint acceptance for supported gateways
4. Keep enhanced monitoring active for first 24 hours.

## 3. Rollback Strategy

If launch checks fail:

1. Put app into maintenance mode:
   - `php artisan down`
2. Roll back to previous known-good image tags.
3. Restore database from latest verified backup if schema/data integrity is affected.
4. Restart queue workers and clear stale cache.
5. Validate health endpoints before reopening traffic.

Detailed commands: [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md).

## 4. Post-Launch Monitoring Checklist

- [ ] Track request latency and error rate on `/metrics` and `/metrics/json`
- [ ] Monitor queue backlog and failure rate alerts
- [ ] Monitor database connectivity and query error logs
- [ ] Monitor Redis connectivity and memory pressure
- [ ] Verify webhook verification failures stay within expected baseline
- [ ] Verify tenant isolation anomalies are zero in logs/alerts
- [ ] Confirm no critical alerts for at least 60 minutes after go-live

## 5. Ownership

- Release owner: coordinates deployment and rollback decisions.
- Platform owner: validates infrastructure and observability.
- Application owner: validates business-critical user flows.
- Security owner: validates secrets, webhook integrity, and rate-limit behavior.
