# Monitoring & Observability

Hostinvo Phase 19 monitoring is implemented with native Laravel services and Docker health checks.

## Monitoring Architecture

### 1. Application Metrics

Metrics are collected in Redis and exposed by the backend:

- Request latency (average over rolling window)
- Error rate (5xx responses / total responses)
- Queue depth (per queue + total)
- Job failure rate (failed jobs / total processed+failed)

Implementation:

- Request metrics middleware: `app/Http/Middleware/CaptureRequestMetrics.php`
- Queue event hooks in `AppServiceProvider`:
  - `Queue::after(...)`
  - `Queue::failing(...)`
- Metrics service: `app/Services/Monitoring/MetricsService.php`

Endpoints:

- `GET /metrics` (Prometheus text format)
- `GET /metrics/json` (JSON response)

Access control:

- Protected by `metrics.auth` middleware.
- Uses `MONITORING_METRICS_TOKEN` (header `X-Metrics-Token`, bearer token, or `?token=`).

### 2. Uptime & Health

Existing health endpoints are reused for uptime monitoring:

- `GET /health`
- `GET /health/database`
- `GET /health/redis`
- `GET /health/queue`

These endpoints return status details and appropriate HTTP status codes for monitor probes.

### 3. Container Health Monitoring

Docker health checks are defined for:

- `app`
- `nginx`
- `postgres`
- `redis`
- `queue-worker`
- `scheduler`

Both `docker-compose.yml` (development) and `docker-compose.prod.yml` (production) include health probes.

### 4. Error Tracking & Log Shipping Compatibility

Structured JSON logs are enabled via Laravel logging channels:

- `json_daily`
- `stderr_json`
- `production` stack

This log structure is compatible with shipping pipelines to:

- Loki (via Promtail / Docker logging driver)
- ELK (Filebeat / Logstash)
- CloudWatch Logs (CloudWatch agent / FireLens)

## Alert Triggers

Configured in `config/monitoring.php`:

1. Queue backlog threshold:
   - Trigger when total queue depth >= `MONITORING_ALERT_QUEUE_BACKLOG_THRESHOLD` (default: `500`)
2. Database connectivity failure:
   - Trigger when `/health/database` check status is not `ok`
3. Redis connectivity failure:
   - Trigger when `/health/redis` check status is not `ok`

Alert execution:

- Scheduled every minute from `routes/console.php`
- Service: `app/Services/Monitoring/MonitoringAlertService.php`
- Output:
  - Critical/warning entries to `MONITORING_ALERT_LOG_CHANNEL`
  - Optional webhook delivery via `MONITORING_ALERT_WEBHOOK_URL`

## Environment Variables

Add these to deployment environment:

- `MONITORING_METRICS_TOKEN`
- `MONITORING_METRICS_WINDOW_MINUTES`
- `MONITORING_METRICS_RETENTION_SECONDS`
- `MONITORING_ALERT_QUEUE_BACKLOG_THRESHOLD`
- `MONITORING_ALERT_LOG_CHANNEL`
- `MONITORING_ALERT_WEBHOOK_URL`
